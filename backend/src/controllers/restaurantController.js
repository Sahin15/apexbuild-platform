import RestaurantArea from '../models/RestaurantArea.js';
import RestaurantTable from '../models/RestaurantTable.js';
import RestaurantMenuCategory from '../models/RestaurantMenuCategory.js';
import RestaurantMenuItem from '../models/RestaurantMenuItem.js';
import RestaurantOrder from '../models/RestaurantOrder.js';
import RestaurantBill from '../models/RestaurantBill.js';
import RestaurantShift from '../models/RestaurantShift.js';
import RestaurantRecipe from '../models/RestaurantRecipe.js';
import RestaurantInventoryItem from '../models/RestaurantInventoryItem.js';
import RestaurantInventoryLog from '../models/RestaurantInventoryLog.js';
import RestaurantVendor from '../models/RestaurantVendor.js';
import RestaurantPurchaseOrder from '../models/RestaurantPurchaseOrder.js';
import RestaurantCustomer from '../models/RestaurantCustomer.js';
import RestaurantExpense from '../models/RestaurantExpense.js';
import RestaurantAggregatorConfig from '../models/RestaurantAggregatorConfig.js';
import RestaurantReservation from '../models/RestaurantReservation.js';
import RestaurantStaff from '../models/RestaurantStaff.js';
import RestaurantRosterShift from '../models/RestaurantRosterShift.js';
import RestaurantTipPool from '../models/RestaurantTipPool.js';
import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';

// ==========================================
// 1. DASHBOARD ANALYTICS
// ==========================================
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Today's orders
    const todayOrders = await RestaurantOrder.find({
      organizationId,
      createdAt: { $gte: startOfToday },
      status: { $ne: 'CANCELLED' }
    });

    const todaySales = todayOrders.reduce((sum, ord) => sum + (ord.grandTotal || 0), 0);
    const ordersCount = todayOrders.length;

    // 2. Channel counts
    const dineInCount = todayOrders.filter(o => o.orderType === 'DINE_IN').length;
    const takeawayCount = todayOrders.filter(o => o.orderType === 'TAKEAWAY').length;
    const deliveryCount = todayOrders.filter(o => o.orderType === 'DELIVERY').length;

    // 3. Tables & Floor
    const totalTables = await RestaurantTable.countDocuments({ organizationId, isActive: true });
    const activeTables = await RestaurantTable.countDocuments({ organizationId, status: 'OCCUPIED' });

    // 4. Kitchen tickets
    const kitchenActiveTickets = await RestaurantOrder.countDocuments({
      organizationId,
      status: { $in: ['CONFIRMED', 'PREPARING'] }
    });
    const kitchenReadyTickets = await RestaurantOrder.countDocuments({
      organizationId,
      status: 'READY'
    });

    // 5. Low stock / Out of stock items
    const outOfStockCount = await RestaurantMenuItem.countDocuments({
      organizationId,
      is86ed: true
    });

    // 6. Recent Orders (last 10)
    const recentOrders = await RestaurantOrder.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(10);

    // 7. 7-Day Revenue Trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastOrders = await RestaurantOrder.find({
      organizationId,
      createdAt: { $gte: sevenDaysAgo },
      status: { $ne: 'CANCELLED' }
    });

    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dayKey = daysMap[d.getDay()];
      trendMap[dayKey] = { day: dayKey, sales: 0, orders: 0 };
    }

    pastOrders.forEach(ord => {
      const dayKey = daysMap[new Date(ord.createdAt).getDay()];
      if (trendMap[dayKey]) {
        trendMap[dayKey].sales += ord.grandTotal || 0;
        trendMap[dayKey].orders += 1;
      }
    });

    const weeklyTrend = Object.values(trendMap);

    // 8. Areas summary
    const areas = await RestaurantArea.find({ organizationId, isActive: true });
    const areaSummaries = await Promise.all(areas.map(async (area) => {
      const total = await RestaurantTable.countDocuments({ organizationId, areaId: area._id, isActive: true });
      const occupied = await RestaurantTable.countDocuments({ organizationId, areaId: area._id, status: 'OCCUPIED' });
      return {
        name: area.name,
        occupied,
        total,
        rate: total > 0 ? `${Math.round((occupied / total) * 100)}%` : '0%'
      };
    }));

    res.status(200).json({
      status: 'success',
      data: {
        todaySales,
        ordersCount,
        dineInCount,
        takeawayCount,
        deliveryCount,
        totalTables,
        activeTables,
        occupancyRate: totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0,
        kitchenActiveTickets,
        kitchenReadyTickets,
        outOfStockCount,
        avgOrderValue: ordersCount > 0 ? Math.round(todaySales / ordersCount) : 0,
        recentOrders,
        weeklyTrend,
        areaSummaries
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. TABLES & FLOOR
// ==========================================
export const getTables = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const tables = await RestaurantTable.find({ organizationId, isActive: true })
      .populate('areaId', 'name')
      .populate('activeOrderId', 'orderNumber guestCount grandTotal items status')
      .sort({ displayOrder: 1, tableNumber: 1 });

    const areas = await RestaurantArea.find({ organizationId, isActive: true })
      .sort({ displayOrder: 1 });

    res.status(200).json({
      status: 'success',
      data: { tables, areas }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. MENU & CATEGORIES
// ==========================================
export const getCategoriesAndMenu = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const categories = await RestaurantMenuCategory.find({ organizationId, isActive: true })
      .sort({ displayOrder: 1 });

    const items = await RestaurantMenuItem.find({ organizationId, isAvailable: true })
      .populate('categoryId', 'name')
      .sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      status: 'success',
      data: { categories, items }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. ORDERS (POS & KOT)
// ==========================================
export const getOrders = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { status, orderType, limit = 20 } = req.query;

    const filter = { organizationId };
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    const orders = await RestaurantOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      status: 'success',
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { 
      orderType = 'DINE_IN', 
      tableId, 
      tableName, 
      guestCount = 1, 
      customerName, 
      customerPhone, 
      items = [] 
    } = req.body;

    if (!items || items.length === 0) {
      return next(new AppError('Order must contain at least one item', 400));
    }

    // Compute bill components
    const subTotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const serviceCharge = Math.round(subTotal * 0.05); // 5%
    const taxTotal = Math.round(subTotal * 0.05); // 5% GST
    const grandTotal = subTotal + serviceCharge + taxTotal;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const order = await RestaurantOrder.create({
      organizationId,
      orderNumber,
      orderType,
      tableId: tableId || null,
      tableName: tableName || (orderType === 'DINE_IN' ? 'Table' : orderType),
      guestCount: Number(guestCount) || 1,
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      stewardId: req.user._id,
      stewardName: req.user.name || 'Staff',
      items: items.map(i => ({
        menuItemId: i.menuItemId || i.id,
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity) || 1,
        station: i.station || 'General',
        notes: i.notes || '',
        veg: i.veg !== false,
        status: 'PREPARING',
        ready: false
      })),
      subTotal,
      serviceCharge,
      taxTotal,
      grandTotal,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      createdBy: req.user._id
    });

    // If Dine-in and tableId provided, mark table OCCUPIED
    if (orderType === 'DINE_IN' && tableId) {
      await RestaurantTable.findByIdAndUpdate(tableId, {
        status: 'OCCUPIED',
        activeOrderId: order._id,
        currentGuests: Number(guestCount) || 1,
        assignedSteward: req.user.name,
        lastOccupiedAt: new Date()
      });
    }

    res.status(201).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const order = await RestaurantOrder.findOne({ _id: id, organizationId });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    order.status = status;
    if (status === 'CANCELLED') {
      order.cancellationReason = cancellationReason || 'Cancelled by manager';
    }
    if (status === 'COMPLETED') {
      order.completedAt = new Date();
      order.paymentStatus = 'PAID';
    }
    await order.save();

    // Free table if completed or cancelled
    if (['COMPLETED', 'CANCELLED'].includes(status) && order.tableId) {
      await RestaurantTable.findByIdAndUpdate(order.tableId, {
        status: 'AVAILABLE',
        activeOrderId: null,
        currentGuests: 0
      });
    }

    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. KITCHEN DISPLAY SYSTEM (KDS)
// ==========================================
export const getKdsTickets = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { station } = req.query;

    const query = {
      organizationId,
      status: { $in: ['CONFIRMED', 'PREPARING', 'READY'] }
    };

    const orders = await RestaurantOrder.find(query).sort({ createdAt: 1 });

    const tickets = orders.map(order => {
      const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000));
      let items = order.items;

      if (station && station !== 'ALL') {
        items = items.filter(item => item.station === station);
      }

      return {
        id: `TK-${order.orderNumber.replace('ORD-', '')}`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        table: (order.aggregator && order.aggregator !== 'NONE') 
          ? `🛵 ${order.aggregator} #${order.aggregatorOrderId || order.orderNumber}`
          : (order.tableName || order.orderType),
        channel: order.orderType,
        aggregator: order.aggregator || 'NONE',
        aggregatorOrderId: order.aggregatorOrderId || '',
        cookingInstructions: order.cookingInstructions || '',
        steward: order.stewardName,
        elapsedMinutes,
        status: order.status,
        createdAt: order.createdAt,
        items
      };
    }).filter(t => t.items.length > 0);

    res.status(200).json({
      status: 'success',
      data: { tickets }
    });
  } catch (error) {
    next(error);
  }
};

export const updateKdsItemReady = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { orderId, itemId } = req.params;

    const order = await RestaurantOrder.findOne({ _id: orderId, organizationId });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const item = order.items.id(itemId);
    if (!item) {
      return next(new AppError('Item not found in order', 404));
    }

    item.ready = !item.ready;
    item.readyAt = item.ready ? new Date() : null;
    item.status = item.ready ? 'READY' : 'PREPARING';

    // If all items are ready, advance order status to READY
    const allReady = order.items.every(i => i.ready);
    order.status = allReady ? 'READY' : 'PREPARING';

    await order.save();

    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

export const bumpKdsTicket = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { orderId } = req.params;

    const order = await RestaurantOrder.findOne({ _id: orderId, organizationId });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    order.status = 'SERVED';
    order.items.forEach(i => { i.ready = true; i.status = 'SERVED'; });
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Ticket bumped and marked as served',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. BILLING & SETTLEMENT
// ==========================================
export const settleOrderBill = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { orderId } = req.params;
    const { paymentMethod = 'CASH', paymentReference = '' } = req.body;

    const order = await RestaurantOrder.findOne({ _id: orderId, organizationId });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const billNumber = `BILL-${Date.now().toString().slice(-6)}`;

    const bill = await RestaurantBill.create({
      organizationId,
      billNumber,
      orderId: order._id,
      subTotal: order.subTotal,
      discount: order.discount || 0,
      serviceCharge: order.serviceCharge || 0,
      cgst: Math.round(order.subTotal * 0.025),
      sgst: Math.round(order.subTotal * 0.025),
      grandTotal: order.grandTotal,
      paymentStatus: 'PAID',
      paidAmount: order.grandTotal,
      paymentSplits: [{
        method: paymentMethod,
        amount: order.grandTotal,
        reference: paymentReference
      }],
      settledBy: req.user._id,
      invoiceDate: new Date()
    });

    order.paymentStatus = 'PAID';
    order.status = 'COMPLETED';
    order.completedAt = new Date();
    await order.save();

    // Free table
    if (order.tableId) {
      await RestaurantTable.findByIdAndUpdate(order.tableId, {
        status: 'AVAILABLE',
        activeOrderId: null,
        currentGuests: 0
      });
    }

    res.status(201).json({
      status: 'success',
      data: { bill, order }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. MENU & CATEGORY MANAGEMENT CRUD
// ==========================================
export const createCategory = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { name, description, defaultStation = 'General', displayOrder = 0 } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Category name is required', 400));
    }

    const category = await RestaurantMenuCategory.create({
      organizationId,
      name: name.trim(),
      description: description || '',
      defaultStation,
      displayOrder: Number(displayOrder) || 0,
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { name, description, defaultStation, displayOrder, isActive } = req.body;

    const category = await RestaurantMenuCategory.findOne({ _id: id, organizationId });
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (defaultStation !== undefined) category.defaultStation = defaultStation;
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.status(200).json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const category = await RestaurantMenuCategory.findOne({ _id: id, organizationId });
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Check if active items exist under this category
    const itemCount = await RestaurantMenuItem.countDocuments({
      organizationId,
      categoryId: id,
      isAvailable: true
    });

    if (itemCount > 0) {
      return next(new AppError(`Cannot delete category with ${itemCount} active menu items. Reassign or remove items first.`, 400));
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name,
      code,
      categoryId,
      price,
      veg = true,
      dietaryType = 'VEG',
      station = 'General',
      description = '',
      preparationTimeMinutes = 15,
      isAvailable = true,
      is86ed = false,
      displayOrder = 0
    } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Item name is required', 400));
    }
    if (!categoryId) {
      return next(new AppError('Category is required', 400));
    }
    if (price === undefined || price === null || Number(price) < 0) {
      return next(new AppError('Valid price is required', 400));
    }

    // Auto-generate code if omitted
    const itemCode = code && code.trim() ? code.trim() : `ITM-${Date.now().toString().slice(-4)}`;

    const item = await RestaurantMenuItem.create({
      organizationId,
      categoryId,
      name: name.trim(),
      code: itemCode,
      description,
      price: Number(price),
      veg: Boolean(veg),
      dietaryType: dietaryType || (veg ? 'VEG' : 'NON_VEG'),
      station: station || 'General',
      preparationTimeMinutes: Number(preparationTimeMinutes) || 15,
      isAvailable: Boolean(isAvailable),
      is86ed: Boolean(is86ed),
      displayOrder: Number(displayOrder) || 0
    });

    const populatedItem = await RestaurantMenuItem.findById(item._id).populate('categoryId', 'name');

    res.status(201).json({
      status: 'success',
      data: { item: populatedItem }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const {
      name,
      code,
      categoryId,
      price,
      veg,
      dietaryType,
      station,
      description,
      preparationTimeMinutes,
      isAvailable,
      is86ed,
      displayOrder
    } = req.body;

    const item = await RestaurantMenuItem.findOne({ _id: id, organizationId });
    if (!item) {
      return next(new AppError('Menu item not found', 404));
    }

    if (name !== undefined) item.name = name.trim();
    if (code !== undefined) item.code = code.trim();
    if (categoryId !== undefined) item.categoryId = categoryId;
    if (price !== undefined) item.price = Number(price);
    if (veg !== undefined) item.veg = Boolean(veg);
    if (dietaryType !== undefined) item.dietaryType = dietaryType;
    if (station !== undefined) item.station = station;
    if (description !== undefined) item.description = description;
    if (preparationTimeMinutes !== undefined) item.preparationTimeMinutes = Number(preparationTimeMinutes);
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
    if (is86ed !== undefined) item.is86ed = Boolean(is86ed);
    if (displayOrder !== undefined) item.displayOrder = Number(displayOrder);

    await item.save();
    const populatedItem = await RestaurantMenuItem.findById(item._id).populate('categoryId', 'name');

    res.status(200).json({
      status: 'success',
      data: { item: populatedItem }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleMenuItem86 = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const item = await RestaurantMenuItem.findOne({ _id: id, organizationId });
    if (!item) {
      return next(new AppError('Menu item not found', 404));
    }

    item.is86ed = !item.is86ed;
    await item.save();

    res.status(200).json({
      status: 'success',
      message: item.is86ed ? `${item.name} marked as 86'd / Out of Stock` : `${item.name} marked as In Stock`,
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const item = await RestaurantMenuItem.findOne({ _id: id, organizationId });
    if (!item) {
      return next(new AppError('Menu item not found', 404));
    }

    item.isAvailable = false;
    await item.save();

    res.status(200).json({
      status: 'success',
      message: 'Menu item archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. TABLE & FLOOR MANAGEMENT CRUD
// ==========================================
export const createArea = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { name, description = '', displayOrder = 0 } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Area name is required', 400));
    }

    const area = await RestaurantArea.create({
      organizationId,
      name: name.trim(),
      description,
      displayOrder: Number(displayOrder) || 0,
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      data: { area }
    });
  } catch (error) {
    next(error);
  }
};

export const updateArea = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { name, description, displayOrder, isActive } = req.body;

    const area = await RestaurantArea.findOne({ _id: id, organizationId });
    if (!area) {
      return next(new AppError('Area not found', 404));
    }

    if (name !== undefined) area.name = name.trim();
    if (description !== undefined) area.description = description;
    if (displayOrder !== undefined) area.displayOrder = Number(displayOrder);
    if (isActive !== undefined) area.isActive = Boolean(isActive);

    await area.save();

    res.status(200).json({
      status: 'success',
      data: { area }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteArea = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const area = await RestaurantArea.findOne({ _id: id, organizationId });
    if (!area) {
      return next(new AppError('Area not found', 404));
    }

    const tableCount = await RestaurantTable.countDocuments({
      organizationId,
      areaId: id,
      isActive: true
    });

    if (tableCount > 0) {
      return next(new AppError(`Cannot delete area with ${tableCount} active tables. Reassign tables first.`, 400));
    }

    area.isActive = false;
    await area.save();

    res.status(200).json({
      status: 'success',
      message: 'Area archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { tableNumber, areaId, capacity = 4, displayOrder = 0 } = req.body;

    if (!tableNumber || !tableNumber.trim()) {
      return next(new AppError('Table number is required', 400));
    }

    // Check duplicate tableNumber
    const existing = await RestaurantTable.findOne({
      organizationId,
      tableNumber: tableNumber.trim(),
      isActive: true
    });

    if (existing) {
      return next(new AppError(`Table ${tableNumber.trim()} already exists`, 400));
    }

    const table = await RestaurantTable.create({
      organizationId,
      tableNumber: tableNumber.trim(),
      areaId: areaId || null,
      capacity: Number(capacity) || 4,
      displayOrder: Number(displayOrder) || 0,
      status: 'AVAILABLE',
      currentGuests: 0,
      isActive: true
    });

    const populatedTable = await RestaurantTable.findById(table._id).populate('areaId', 'name');

    res.status(201).json({
      status: 'success',
      data: { table: populatedTable }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { tableNumber, areaId, capacity, status, currentGuests, assignedSteward, displayOrder } = req.body;

    const table = await RestaurantTable.findOne({ _id: id, organizationId });
    if (!table) {
      return next(new AppError('Table not found', 404));
    }

    if (tableNumber !== undefined && tableNumber.trim() !== table.tableNumber) {
      const duplicate = await RestaurantTable.findOne({
        organizationId,
        tableNumber: tableNumber.trim(),
        _id: { $ne: id },
        isActive: true
      });
      if (duplicate) {
        return next(new AppError(`Table ${tableNumber.trim()} already exists`, 400));
      }
      table.tableNumber = tableNumber.trim();
    }

    if (areaId !== undefined) table.areaId = areaId || null;
    if (capacity !== undefined) table.capacity = Number(capacity);
    if (status !== undefined) table.status = status;
    if (currentGuests !== undefined) table.currentGuests = Number(currentGuests);
    if (assignedSteward !== undefined) table.assignedSteward = assignedSteward;
    if (displayOrder !== undefined) table.displayOrder = Number(displayOrder);

    await table.save();
    const populated = await RestaurantTable.findById(table._id)
      .populate('areaId', 'name')
      .populate('activeOrderId', 'orderNumber grandTotal status items');

    res.status(200).json({
      status: 'success',
      data: { table: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['AVAILABLE', 'OCCUPIED', 'BILLED', 'CLEANING', 'RESERVED'];
    if (!allowed.includes(status)) {
      return next(new AppError('Invalid table status', 400));
    }

    const table = await RestaurantTable.findOne({ _id: id, organizationId });
    if (!table) {
      return next(new AppError('Table not found', 404));
    }

    table.status = status;
    if (status === 'AVAILABLE' || status === 'CLEANING') {
      table.activeOrderId = null;
      table.currentGuests = 0;
    }

    await table.save();

    res.status(200).json({
      status: 'success',
      message: `Table ${table.tableNumber} status set to ${status}`,
      data: { table }
    });
  } catch (error) {
    next(error);
  }
};

export const transferTable = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { sourceTableId, targetTableId } = req.body;

    if (!sourceTableId || !targetTableId) {
      return next(new AppError('Both source and target table are required', 400));
    }
    if (sourceTableId === targetTableId) {
      return next(new AppError('Source and target table cannot be the same', 400));
    }

    const source = await RestaurantTable.findOne({ _id: sourceTableId, organizationId });
    const target = await RestaurantTable.findOne({ _id: targetTableId, organizationId });

    if (!source || !target) {
      return next(new AppError('Source or target table not found', 404));
    }

    if (source.status !== 'OCCUPIED' && !source.activeOrderId) {
      return next(new AppError(`Source table ${source.tableNumber} has no active order to transfer`, 400));
    }

    if (target.status === 'OCCUPIED') {
      return next(new AppError(`Target table ${target.tableNumber} is already occupied`, 400));
    }

    const orderId = source.activeOrderId;

    // Update order
    if (orderId) {
      await RestaurantOrder.findByIdAndUpdate(orderId, {
        tableId: target._id,
        tableName: target.tableNumber
      });
    }

    // Move to target table
    target.status = 'OCCUPIED';
    target.activeOrderId = orderId;
    target.currentGuests = source.currentGuests || 1;
    target.assignedSteward = source.assignedSteward;
    target.lastOccupiedAt = source.lastOccupiedAt || new Date();
    await target.save();

    // Release source table
    source.status = 'CLEANING';
    source.activeOrderId = null;
    source.currentGuests = 0;
    await source.save();

    res.status(200).json({
      status: 'success',
      message: `Order successfully transferred from ${source.tableNumber} to ${target.tableNumber}`,
      data: { sourceTable: source, targetTable: target }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const table = await RestaurantTable.findOne({ _id: id, organizationId });
    if (!table) {
      return next(new AppError('Table not found', 404));
    }

    if (table.status === 'OCCUPIED') {
      return next(new AppError(`Cannot delete occupied table ${table.tableNumber}. Clear order first.`, 400));
    }

    table.isActive = false;
    await table.save();

    res.status(200).json({
      status: 'success',
      message: `Table ${table.tableNumber} archived successfully`
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 9. BILLING, SETTLEMENT & TAX INVOICES
// ==========================================
export const getBills = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { 
      startDate, 
      endDate, 
      status, 
      paymentMethod, 
      search, 
      limit = 50,
      page = 1 
    } = req.query;

    const query = { organizationId };

    if (status && status !== 'ALL') {
      query.paymentStatus = status;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      query['paymentSplits.method'] = paymentMethod;
    }

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    if (search && search.trim()) {
      query.billNumber = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bills, totalBillsCount] = await Promise.all([
      RestaurantBill.find(query)
        .populate({
          path: 'orderId',
          select: 'orderNumber tableName orderType items guestCount customerName customerPhone stewardName createdAt'
        })
        .populate('settledBy', 'name email')
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RestaurantBill.countDocuments(query)
    ]);

    // Calculate aggregated revenue & tax summaries
    const allOrgBills = await RestaurantBill.find({ organizationId });

    let totalCollected = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalServiceCharge = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let paidCount = 0;

    allOrgBills.forEach(b => {
      if (b.paymentStatus === 'PAID') {
        totalCollected += b.grandTotal || 0;
        totalCGST += b.cgst || 0;
        totalSGST += b.sgst || 0;
        totalServiceCharge += b.serviceCharge || 0;
        paidCount++;

        if (b.paymentSplits && b.paymentSplits.length > 0) {
          b.paymentSplits.forEach(s => {
            if (s.method === 'CASH') cashTotal += s.amount || 0;
            else if (s.method === 'UPI') upiTotal += s.amount || 0;
            else if (s.method === 'CARD') cardTotal += s.amount || 0;
          });
        }
      }
    });

    const avgTicket = paidCount > 0 ? Math.round(totalCollected / paidCount) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        bills,
        totalBillsCount,
        summary: {
          totalCollected,
          paidCount,
          totalCGST,
          totalSGST,
          totalServiceCharge,
          cashTotal,
          upiTotal,
          cardTotal,
          avgTicket
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBillById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const [bill, organization] = await Promise.all([
      RestaurantBill.findOne({ _id: id, organizationId })
        .populate({
          path: 'orderId',
          select: 'orderNumber tableName orderType items guestCount customerName customerPhone stewardName createdAt subTotal discount serviceCharge taxTotal grandTotal'
        })
        .populate('settledBy', 'name email'),
      Organization.findById(organizationId).select('name legalName email phone address city state pincode gstNumber panNumber logo')
    ]);

    if (!bill) {
      return next(new AppError('Bill not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        bill,
        restaurant: organization
      }
    });
  } catch (error) {
    next(error);
  }
};

export const voidBill = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { voidReason = 'Manager Void' } = req.body;

    const bill = await RestaurantBill.findOne({ _id: id, organizationId });
    if (!bill) {
      return next(new AppError('Bill not found', 404));
    }

    if (bill.paymentStatus === 'VOID') {
      return next(new AppError('Bill is already voided', 400));
    }

    bill.paymentStatus = 'VOID';
    bill.notes = `${bill.notes ? bill.notes + ' • ' : ''}VOIDED: ${voidReason} by ${req.user.name || 'Manager'}`;
    await bill.save();

    // Mark order status cancelled
    if (bill.orderId) {
      await RestaurantOrder.findByIdAndUpdate(bill.orderId, {
        status: 'CANCELLED',
        cancellationReason: `Bill voided: ${voidReason}`
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Bill ${bill.billNumber} has been voided`,
      data: { bill }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 10. SHIFTS, CASH DRAWER & VARIANCE ENGINE
// ==========================================
export const getCurrentShift = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const shift = await RestaurantShift.findOne({
      organizationId,
      status: 'OPEN'
    }).sort({ openedAt: -1 });

    if (!shift) {
      return res.status(200).json({
        status: 'success',
        data: { currentShift: null }
      });
    }

    // Aggregate real-time sales made during this shift
    const bills = await RestaurantBill.find({
      organizationId,
      paymentStatus: 'PAID',
      invoiceDate: { $gte: shift.openedAt }
    });

    let liveCashSales = 0;
    let liveUpiSales = 0;
    let liveCardSales = 0;

    bills.forEach(b => {
      if (b.paymentSplits && b.paymentSplits.length > 0) {
        b.paymentSplits.forEach(s => {
          if (s.method === 'CASH') liveCashSales += s.amount || 0;
          else if (s.method === 'UPI') liveUpiSales += s.amount || 0;
          else if (s.method === 'CARD') liveCardSales += s.amount || 0;
        });
      }
    });

    shift.cashSales = liveCashSales;
    shift.upiSales = liveUpiSales;
    shift.cardSales = liveCardSales;
    shift.totalOrdersCount = bills.length;
    shift.expectedCash = Math.max(0, shift.openingFloat + liveCashSales - (shift.cashDrops || 0));
    await shift.save();

    res.status(200).json({
      status: 'success',
      data: {
        currentShift: shift,
        liveSalesSummary: {
          cashSales: liveCashSales,
          upiSales: liveUpiSales,
          cardSales: liveCardSales,
          totalSales: liveCashSales + liveUpiSales + liveCardSales,
          billsCount: bills.length,
          cashDrops: shift.cashDrops || 0,
          openingFloat: shift.openingFloat,
          expectedInDrawer: shift.expectedCash
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const openShift = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { registerNumber = 'Register #1', openingFloat = 5000, notes = '' } = req.body;

    // Check if an open shift already exists
    const existing = await RestaurantShift.findOne({
      organizationId,
      status: 'OPEN'
    });

    if (existing) {
      return next(new AppError(`An open shift is already active on ${existing.registerNumber}. Close it before opening a new shift.`, 400));
    }

    const floatNum = Number(openingFloat) >= 0 ? Number(openingFloat) : 5000;

    const shift = await RestaurantShift.create({
      organizationId,
      cashierId: req.user._id,
      cashierName: req.user.name || 'Staff',
      registerNumber,
      openingFloat: floatNum,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
      cashDrops: 0,
      expectedCash: floatNum,
      status: 'OPEN',
      openedAt: new Date(),
      notes
    });

    res.status(201).json({
      status: 'success',
      message: `Shift opened on ${registerNumber} with float ₹${floatNum}`,
      data: { shift }
    });
  } catch (error) {
    next(error);
  }
};

export const recordCashDrop = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { amount, reason = 'Mid-shift safe transfer' } = req.body;

    if (!amount || Number(amount) <= 0) {
      return next(new AppError('Valid cash drop amount is required', 400));
    }

    const shift = await RestaurantShift.findOne({ _id: id, organizationId });
    if (!shift) {
      return next(new AppError('Shift not found', 404));
    }

    if (shift.status !== 'OPEN') {
      return next(new AppError('Cannot record cash drop on a closed shift', 400));
    }

    const dropAmount = Number(amount);
    shift.drops.push({
      amount: dropAmount,
      reason,
      droppedAt: new Date(),
      droppedBy: req.user.name || 'Staff'
    });

    shift.cashDrops = (shift.cashDrops || 0) + dropAmount;
    shift.expectedCash = Math.max(0, shift.openingFloat + shift.cashSales - shift.cashDrops);
    await shift.save();

    res.status(200).json({
      status: 'success',
      message: `Recorded cash drop of ₹${dropAmount} to safe`,
      data: { shift }
    });
  } catch (error) {
    next(error);
  }
};

export const closeShift = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { countedCash, notes = '' } = req.body;

    if (countedCash === undefined || countedCash === null || isNaN(Number(countedCash)) || Number(countedCash) < 0) {
      return next(new AppError('Physical counted cash amount is required to close shift', 400));
    }

    const shift = await RestaurantShift.findOne({ _id: id, organizationId });
    if (!shift) {
      return next(new AppError('Shift not found', 404));
    }

    if (shift.status === 'CLOSED') {
      return next(new AppError('This shift is already closed', 400));
    }

    // Final live aggregation of bills
    const bills = await RestaurantBill.find({
      organizationId,
      paymentStatus: 'PAID',
      invoiceDate: { $gte: shift.openedAt }
    });

    let liveCashSales = 0;
    let liveUpiSales = 0;
    let liveCardSales = 0;

    bills.forEach(b => {
      if (b.paymentSplits && b.paymentSplits.length > 0) {
        b.paymentSplits.forEach(s => {
          if (s.method === 'CASH') liveCashSales += s.amount || 0;
          else if (s.method === 'UPI') liveUpiSales += s.amount || 0;
          else if (s.method === 'CARD') liveCardSales += s.amount || 0;
        });
      }
    });

    const physicalCash = Number(countedCash);
    const expected = shift.openingFloat + liveCashSales - (shift.cashDrops || 0);
    const variance = physicalCash - expected;

    shift.closedAt = new Date();
    shift.cashSales = liveCashSales;
    shift.upiSales = liveUpiSales;
    shift.cardSales = liveCardSales;
    shift.totalOrdersCount = bills.length;
    shift.expectedCash = expected;
    shift.countedCash = physicalCash;
    shift.variance = variance;
    shift.status = 'CLOSED';
    if (notes) shift.notes = `${shift.notes ? shift.notes + ' • ' : ''}Close notes: ${notes}`;

    await shift.save();

    res.status(200).json({
      status: 'success',
      message: `Shift closed. Variance: ${variance >= 0 ? '+' : ''}₹${variance}`,
      data: { shift }
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftsHistory = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { limit = 20, page = 1 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [shifts, totalShifts] = await Promise.all([
      RestaurantShift.find({ organizationId })
        .sort({ openedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RestaurantShift.countDocuments({ organizationId })
    ]);

    // Financial shift summary
    const allShifts = await RestaurantShift.find({ organizationId });
    let totalCashHandled = 0;
    let totalVariance = 0;
    let totalDrops = 0;
    let closedCount = 0;

    allShifts.forEach(s => {
      totalCashHandled += s.cashSales || 0;
      totalDrops += s.cashDrops || 0;
      if (s.status === 'CLOSED') {
        totalVariance += s.variance || 0;
        closedCount++;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        shifts,
        totalShifts,
        summary: {
          closedCount,
          totalCashHandled,
          totalDrops,
          totalVariance
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 10. RECIPE MANAGEMENT & INGREDIENT COSTING
// ==========================================

// Helper to compute line costs and recipe financials
const calculateRecipeMetrics = (ingredients = [], yieldPortions = 1, sellingPrice = 0, targetCostPercentage = 32) => {
  const portions = Number(yieldPortions) > 0 ? Number(yieldPortions) : 1;
  const price = Number(sellingPrice) >= 0 ? Number(sellingPrice) : 0;

  const processedIngredients = (ingredients || []).map(ing => {
    const qty = Math.max(0, Number(ing.quantity) || 0);
    const uCost = Math.max(0, Number(ing.unitCost) || 0);
    const yFactor = Math.min(100, Math.max(1, Number(ing.yieldFactor) || 100));
    // Yield factor accounting for prep/cooking loss: lineCost = (qty * unitCost) / (yFactor / 100)
    const lineCost = Math.round(((qty * uCost) / (yFactor / 100)) * 100) / 100;
    return {
      name: (ing.name || '').trim(),
      quantity: qty,
      uom: ing.uom || 'g',
      unitCost: uCost,
      yieldFactor: yFactor,
      lineCost
    };
  });

  const totalBatchCost = Math.round(processedIngredients.reduce((sum, item) => sum + item.lineCost, 0) * 100) / 100;
  const portionCost = Math.round((totalBatchCost / portions) * 100) / 100;
  const foodCostPercentage = price > 0 ? Math.round(((portionCost / price) * 100) * 10) / 10 : 0;
  const grossMarginPercentage = price > 0 ? Math.round((100 - foodCostPercentage) * 10) / 10 : 0;
  const contributionMargin = Math.round((price - portionCost) * 100) / 100;

  let costStatus = 'OPTIMAL';
  if (foodCostPercentage > 35) {
    costStatus = 'HIGH_ALERT';
  } else if (foodCostPercentage > 30) {
    costStatus = 'ACCEPTABLE';
  }

  return {
    ingredients: processedIngredients,
    yieldPortions: portions,
    sellingPrice: price,
    totalBatchCost,
    portionCost,
    foodCostPercentage,
    grossMarginPercentage,
    contributionMargin,
    targetCostPercentage: Number(targetCostPercentage) || 32,
    costStatus
  };
};

export const getRecipes = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, status, categoryId, station } = req.query;

    let query = { organizationId, isActive: true };
    if (status && ['OPTIMAL', 'ACCEPTABLE', 'HIGH_ALERT'].includes(status)) {
      query.costStatus = status;
    }

    const recipes = await RestaurantRecipe.find(query)
      .populate({
        path: 'menuItemId',
        select: 'name code price veg dietaryType station categoryId isAvailable is86ed imageUrl',
        populate: { path: 'categoryId', select: 'name' }
      })
      .sort({ updatedAt: -1 });

    // Filter in-memory for search, categoryId, station
    let filteredRecipes = recipes.filter(r => r.menuItemId);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredRecipes = filteredRecipes.filter(r => 
        (r.recipeName && r.recipeName.toLowerCase().includes(q)) ||
        (r.menuItemId?.name && r.menuItemId.name.toLowerCase().includes(q)) ||
        (r.menuItemId?.code && r.menuItemId.code.toLowerCase().includes(q)) ||
        r.ingredients.some(ing => ing.name && ing.name.toLowerCase().includes(q))
      );
    }

    if (categoryId) {
      filteredRecipes = filteredRecipes.filter(r => 
        r.menuItemId?.categoryId?._id?.toString() === categoryId ||
        r.menuItemId?.categoryId?.toString() === categoryId
      );
    }

    if (station && station !== 'All') {
      filteredRecipes = filteredRecipes.filter(r => r.menuItemId?.station === station);
    }

    // KPI Summary
    const totalRecipes = recipes.length;
    let totalFoodCostSum = 0;
    let highAlertCount = 0;
    let acceptableCount = 0;
    let optimalCount = 0;

    recipes.forEach(r => {
      totalFoodCostSum += r.foodCostPercentage || 0;
      if (r.costStatus === 'HIGH_ALERT') highAlertCount++;
      else if (r.costStatus === 'ACCEPTABLE') acceptableCount++;
      else optimalCount++;
    });

    const averageFoodCostPercentage = totalRecipes > 0 
      ? Math.round((totalFoodCostSum / totalRecipes) * 10) / 10 
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        recipes: filteredRecipes,
        summary: {
          totalRecipes,
          averageFoodCostPercentage,
          highAlertCount,
          acceptableCount,
          optimalCount,
          averageGrossMarginPercentage: totalRecipes > 0 ? Math.round((100 - averageFoodCostPercentage) * 10) / 10 : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipeById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const recipe = await RestaurantRecipe.findOne({ _id: id, organizationId })
      .populate({
        path: 'menuItemId',
        select: 'name code price veg dietaryType station categoryId isAvailable imageUrl',
        populate: { path: 'categoryId', select: 'name' }
      });

    if (!recipe) {
      return next(new AppError('Recipe not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { recipe }
    });
  } catch (error) {
    next(error);
  }
};

export const createRecipe = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      menuItemId,
      recipeName,
      yieldPortions = 1,
      ingredients = [],
      targetCostPercentage = 32,
      allergens = [],
      prepTimeMinutes = 15,
      preparationNotes = ''
    } = req.body;

    if (!menuItemId) {
      return next(new AppError('Menu item reference is required', 400));
    }

    const menuItem = await RestaurantMenuItem.findOne({ _id: menuItemId, organizationId });
    if (!menuItem) {
      return next(new AppError('Associated menu item not found in this organization', 404));
    }

    // Check if recipe already exists for this menu item
    const existing = await RestaurantRecipe.findOne({ organizationId, menuItemId });
    if (existing) {
      return next(new AppError('A recipe BOM already exists for this menu item. Please edit the existing recipe instead.', 400));
    }

    const metrics = calculateRecipeMetrics(
      ingredients,
      yieldPortions,
      menuItem.price,
      targetCostPercentage
    );

    const recipe = await RestaurantRecipe.create({
      organizationId,
      menuItemId,
      recipeName: (recipeName && recipeName.trim()) || `${menuItem.name} Standard Recipe`,
      yieldPortions: metrics.yieldPortions,
      ingredients: metrics.ingredients,
      totalBatchCost: metrics.totalBatchCost,
      portionCost: metrics.portionCost,
      sellingPrice: metrics.sellingPrice,
      foodCostPercentage: metrics.foodCostPercentage,
      grossMarginPercentage: metrics.grossMarginPercentage,
      contributionMargin: metrics.contributionMargin,
      targetCostPercentage: metrics.targetCostPercentage,
      costStatus: metrics.costStatus,
      allergens,
      prepTimeMinutes: Number(prepTimeMinutes) || menuItem.preparationTimeMinutes || 15,
      preparationNotes,
      isActive: true
    });

    const populated = await RestaurantRecipe.findById(recipe._id).populate({
      path: 'menuItemId',
      select: 'name code price veg dietaryType station categoryId isAvailable imageUrl',
      populate: { path: 'categoryId', select: 'name' }
    });

    res.status(201).json({
      status: 'success',
      data: { recipe: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecipe = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const {
      recipeName,
      yieldPortions,
      ingredients,
      targetCostPercentage,
      allergens,
      prepTimeMinutes,
      preparationNotes,
      isActive
    } = req.body;

    const recipe = await RestaurantRecipe.findOne({ _id: id, organizationId });
    if (!recipe) {
      return next(new AppError('Recipe not found', 404));
    }

    // Fetch current menu item to get current selling price
    const menuItem = await RestaurantMenuItem.findById(recipe.menuItemId);
    const sellingPrice = menuItem ? menuItem.price : recipe.sellingPrice;

    if (recipeName !== undefined) recipe.recipeName = recipeName.trim();
    if (allergens !== undefined) recipe.allergens = allergens;
    if (prepTimeMinutes !== undefined) recipe.prepTimeMinutes = Number(prepTimeMinutes);
    if (preparationNotes !== undefined) recipe.preparationNotes = preparationNotes;
    if (isActive !== undefined) recipe.isActive = Boolean(isActive);

    const updatedYield = yieldPortions !== undefined ? yieldPortions : recipe.yieldPortions;
    const updatedIngredients = ingredients !== undefined ? ingredients : recipe.ingredients;
    const updatedTarget = targetCostPercentage !== undefined ? targetCostPercentage : recipe.targetCostPercentage;

    const metrics = calculateRecipeMetrics(
      updatedIngredients,
      updatedYield,
      sellingPrice,
      updatedTarget
    );

    recipe.yieldPortions = metrics.yieldPortions;
    recipe.ingredients = metrics.ingredients;
    recipe.totalBatchCost = metrics.totalBatchCost;
    recipe.portionCost = metrics.portionCost;
    recipe.sellingPrice = metrics.sellingPrice;
    recipe.foodCostPercentage = metrics.foodCostPercentage;
    recipe.grossMarginPercentage = metrics.grossMarginPercentage;
    recipe.contributionMargin = metrics.contributionMargin;
    recipe.targetCostPercentage = metrics.targetCostPercentage;
    recipe.costStatus = metrics.costStatus;

    await recipe.save();

    const populated = await RestaurantRecipe.findById(recipe._id).populate({
      path: 'menuItemId',
      select: 'name code price veg dietaryType station categoryId isAvailable imageUrl',
      populate: { path: 'categoryId', select: 'name' }
    });

    res.status(200).json({
      status: 'success',
      data: { recipe: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecipe = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const recipe = await RestaurantRecipe.findOneAndDelete({ _id: id, organizationId });
    if (!recipe) {
      return next(new AppError('Recipe not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 11. RAW INGREDIENT INVENTORY & PAR ALERTS
// ==========================================

export const getInventoryItems = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, category, storageLocation, status } = req.query;

    let query = { organizationId, isActive: true };
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (storageLocation && storageLocation !== 'ALL') {
      query.storageLocation = storageLocation;
    }

    const items = await RestaurantInventoryItem.find(query).sort({ category: 1, name: 1 });

    // Filter in-memory for search & status if specified
    let filteredItems = items;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.storageLocation && item.storageLocation.toLowerCase().includes(q)) ||
        (item.preferredSupplier && item.preferredSupplier.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'ALL') {
      filteredItems = filteredItems.filter(item => item.stockStatus === status);
    }

    // KPI Summary
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let optimalCount = 0;
    let overstockedCount = 0;

    items.forEach(item => {
      totalInventoryValue += (item.currentStock || 0) * (item.unitCost || 0);
      const st = item.stockStatus;
      if (st === 'OUT_OF_STOCK') outOfStockCount++;
      else if (st === 'LOW_STOCK') lowStockCount++;
      else if (st === 'OVERSTOCKED') overstockedCount++;
      else optimalCount++;
    });

    totalInventoryValue = Math.round(totalInventoryValue * 100) / 100;

    res.status(200).json({
      status: 'success',
      data: {
        items: filteredItems,
        summary: {
          totalSKUs: items.length,
          totalInventoryValue,
          lowStockCount,
          outOfStockCount,
          optimalCount,
          overstockedCount,
          criticalParAlerts: lowStockCount + outOfStockCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryItemById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const item = await RestaurantInventoryItem.findOne({ _id: id, organizationId });
    if (!item) {
      return next(new AppError('Inventory item not found', 404));
    }

    const logs = await RestaurantInventoryLog.find({ organizationId, inventoryItemId: id })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      status: 'success',
      data: { item, logs }
    });
  } catch (error) {
    next(error);
  }
};

export const createInventoryItem = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name,
      code,
      category,
      storageLocation,
      uom = 'kg',
      currentStock = 0,
      minStock = 5,
      maxStock = 50,
      unitCost = 0,
      preferredSupplier = '',
      is86Trigger = false,
      notes = ''
    } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Ingredient name is required', 400));
    }

    const stock = Math.max(0, Number(currentStock) || 0);
    const cost = Math.max(0, Number(unitCost) || 0);
    const itemCode = code && code.trim() ? code.trim() : `ING-${Date.now().toString().slice(-4)}`;
    const totalValue = Math.round(stock * cost * 100) / 100;

    const item = await RestaurantInventoryItem.create({
      organizationId,
      name: name.trim(),
      code: itemCode,
      category: category || 'General Supplies',
      storageLocation: storageLocation || 'Dry Store Room',
      uom,
      currentStock: stock,
      minStock: Math.max(0, Number(minStock) || 0),
      maxStock: Math.max(0, Number(maxStock) || 50),
      unitCost: cost,
      totalValue,
      preferredSupplier: preferredSupplier ? preferredSupplier.trim() : '',
      is86Trigger: Boolean(is86Trigger),
      notes: notes || '',
      isActive: true
    });

    if (stock > 0) {
      await RestaurantInventoryLog.create({
        organizationId,
        inventoryItemId: item._id,
        type: 'INWARD',
        quantityChange: stock,
        previousStock: 0,
        newStock: stock,
        unitCost: cost,
        totalCostImpact: totalValue,
        referenceNo: 'INIT-OPENING',
        reason: 'Initial opening inventory setup',
        performedBy: req.user._id
      });
    }

    res.status(201).json({
      status: 'success',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const updateInventoryItem = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const {
      name,
      code,
      category,
      storageLocation,
      uom,
      minStock,
      maxStock,
      unitCost,
      preferredSupplier,
      is86Trigger,
      notes,
      isActive
    } = req.body;

    const item = await RestaurantInventoryItem.findOne({ _id: id, organizationId });
    if (!item) {
      return next(new AppError('Inventory item not found', 404));
    }

    if (name !== undefined) item.name = name.trim();
    if (code !== undefined) item.code = code.trim();
    if (category !== undefined) item.category = category;
    if (storageLocation !== undefined) item.storageLocation = storageLocation;
    if (uom !== undefined) item.uom = uom;
    if (minStock !== undefined) item.minStock = Math.max(0, Number(minStock) || 0);
    if (maxStock !== undefined) item.maxStock = Math.max(0, Number(maxStock) || 0);
    if (preferredSupplier !== undefined) item.preferredSupplier = preferredSupplier.trim();
    if (is86Trigger !== undefined) item.is86Trigger = Boolean(is86Trigger);
    if (notes !== undefined) item.notes = notes;
    if (isActive !== undefined) item.isActive = Boolean(isActive);

    if (unitCost !== undefined) {
      item.unitCost = Math.max(0, Number(unitCost) || 0);
    }
    item.totalValue = Math.round((item.currentStock || 0) * (item.unitCost || 0) * 100) / 100;

    await item.save();

    res.status(200).json({
      status: 'success',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const adjustInventoryStock = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { type, quantityChange, newPhysicalCount, referenceNo, reason } = req.body;

    const item = await RestaurantInventoryItem.findOne({ _id: id, organizationId });
    if (!item) {
      return next(new AppError('Inventory item not found', 404));
    }

    const previousStock = item.currentStock;
    let calculatedNewStock = previousStock;
    let netChange = 0;

    if (type === 'AUDIT_ADJUSTMENT') {
      if (newPhysicalCount !== undefined && newPhysicalCount !== null && newPhysicalCount !== '') {
        calculatedNewStock = Math.max(0, Number(newPhysicalCount));
        netChange = calculatedNewStock - previousStock;
      } else {
        netChange = Number(quantityChange) || 0;
        calculatedNewStock = Math.max(0, previousStock + netChange);
      }
    } else if (type === 'INWARD') {
      const qty = Math.abs(Number(quantityChange) || 0);
      calculatedNewStock = previousStock + qty;
      netChange = qty;
    } else if (type === 'KITCHEN_ISSUE' || type === 'WASTAGE_SPOILAGE' || type === 'RETURN') {
      const qty = Math.abs(Number(quantityChange) || 0);
      calculatedNewStock = Math.max(0, previousStock - qty);
      netChange = -qty;
    } else {
      return next(new AppError('Invalid adjustment movement type', 400));
    }

    const costImpact = Math.round(Math.abs(netChange) * item.unitCost * 100) / 100;

    item.currentStock = calculatedNewStock;
    item.totalValue = Math.round(calculatedNewStock * item.unitCost * 100) / 100;
    await item.save();

    const log = await RestaurantInventoryLog.create({
      organizationId,
      inventoryItemId: item._id,
      type,
      quantityChange: netChange,
      previousStock,
      newStock: calculatedNewStock,
      unitCost: item.unitCost,
      totalCostImpact: costImpact,
      referenceNo: referenceNo || '',
      reason: reason || `Manual stock adjustment: ${type}`,
      performedBy: req.user._id
    });

    res.status(200).json({
      status: 'success',
      data: { item, log }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInventoryItem = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const item = await RestaurantInventoryItem.findOne({ _id: id, organizationId });
    if (!item) {
      return next(new AppError('Inventory item not found', 404));
    }

    item.isActive = false;
    await item.save();

    res.status(200).json({
      status: 'success',
      message: 'Inventory item archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 12. PROCUREMENT, VENDORS & PURCHASE ORDERS
// ==========================================

export const getProcurementSummary = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [pos, vendors] = await Promise.all([
      RestaurantPurchaseOrder.find({ organizationId }),
      RestaurantVendor.find({ organizationId, isActive: true })
    ]);

    let monthlySpend = 0;
    let pendingPOCount = 0;
    let totalGRNCount = 0;
    let totalPayables = 0;

    pos.forEach(po => {
      if (po.createdAt >= startOfMonth && po.status !== 'CANCELLED') {
        monthlySpend += po.grandTotal || 0;
      }
      if (['ORDERED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
        pendingPOCount++;
      }
      totalGRNCount += (po.grnReceipts || []).length;
    });

    vendors.forEach(v => {
      totalPayables += v.outstandingBalance || 0;
    });

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          monthlySpend: Math.round(monthlySpend * 100) / 100,
          pendingPOCount,
          totalGRNCount,
          totalPayables: Math.round(totalPayables * 100) / 100,
          totalVendors: vendors.length,
          totalPOs: pos.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getVendors = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, category } = req.query;

    let query = { organizationId, isActive: true };
    if (category && category !== 'ALL') {
      query.category = category;
    }

    const vendors = await RestaurantVendor.find(query).sort({ name: 1 });

    let filtered = vendors;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(q) ||
        (v.code && v.code.toLowerCase().includes(q)) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q))
      );
    }

    res.status(200).json({
      status: 'success',
      data: { vendors: filtered }
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const vendor = await RestaurantVendor.findOne({ _id: id, organizationId });
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }

    const recentOrders = await RestaurantPurchaseOrder.find({ organizationId, vendorId: id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: { vendor, recentOrders }
    });
  } catch (error) {
    next(error);
  }
};

export const createVendor = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name,
      code,
      category,
      contactPerson,
      phone,
      email,
      address,
      gstin,
      paymentTerms = 'NET_7'
    } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Vendor name is required', 400));
    }

    const vendorCode = code && code.trim() ? code.trim() : `VND-${Date.now().toString().slice(-4)}`;

    const vendor = await RestaurantVendor.create({
      organizationId,
      name: name.trim(),
      code: vendorCode,
      category: category || 'General Supplies',
      contactPerson: contactPerson ? contactPerson.trim() : '',
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      paymentTerms,
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

export const updateVendor = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const {
      name,
      code,
      category,
      contactPerson,
      phone,
      email,
      address,
      gstin,
      paymentTerms,
      outstandingBalance,
      isActive
    } = req.body;

    const vendor = await RestaurantVendor.findOne({ _id: id, organizationId });
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }

    if (name !== undefined) vendor.name = name.trim();
    if (code !== undefined) vendor.code = code.trim();
    if (category !== undefined) vendor.category = category;
    if (contactPerson !== undefined) vendor.contactPerson = contactPerson.trim();
    if (phone !== undefined) vendor.phone = phone.trim();
    if (email !== undefined) vendor.email = email.trim();
    if (address !== undefined) vendor.address = address.trim();
    if (gstin !== undefined) vendor.gstin = gstin.trim().toUpperCase();
    if (paymentTerms !== undefined) vendor.paymentTerms = paymentTerms;
    if (outstandingBalance !== undefined) vendor.outstandingBalance = Number(outstandingBalance) || 0;
    if (isActive !== undefined) vendor.isActive = Boolean(isActive);

    await vendor.save();

    res.status(200).json({
      status: 'success',
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVendor = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const vendor = await RestaurantVendor.findOne({ _id: id, organizationId });
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }

    vendor.isActive = false;
    await vendor.save();

    res.status(200).json({
      status: 'success',
      message: 'Vendor archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrders = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { status, vendorId, search } = req.query;

    let query = { organizationId };
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (vendorId && vendorId !== 'ALL') {
      query.vendorId = vendorId;
    }

    const pos = await RestaurantPurchaseOrder.find(query)
      .populate('vendorId', 'name code phone gstin paymentTerms')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    let filtered = pos;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(po => 
        po.poNumber.toLowerCase().includes(q) ||
        (po.vendorId?.name && po.vendorId.name.toLowerCase().includes(q)) ||
        (po.notes && po.notes.toLowerCase().includes(q)) ||
        po.items.some(item => item.itemName.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      status: 'success',
      data: { purchaseOrders: filtered }
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const po = await RestaurantPurchaseOrder.findOne({ _id: id, organizationId })
      .populate('vendorId', 'name code phone email gstin address paymentTerms')
      .populate('createdBy', 'name email role')
      .populate('grnReceipts.receivedBy', 'name email');

    if (!po) {
      return next(new AppError('Purchase order not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { purchaseOrder: po }
    });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      vendorId,
      poNumber,
      orderDate,
      expectedDeliveryDate,
      items = [],
      notes = ''
    } = req.body;

    if (!vendorId) {
      return next(new AppError('Vendor selection is required', 400));
    }
    if (!items || items.length === 0) {
      return next(new AppError('At least one line item is required in the PO', 400));
    }

    const vendor = await RestaurantVendor.findOne({ _id: vendorId, organizationId });
    if (!vendor) {
      return next(new AppError('Selected vendor does not exist in this organization', 404));
    }

    const generatedPoNumber = poNumber && poNumber.trim() 
      ? poNumber.trim() 
      : `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    let subTotal = 0;
    let taxTotal = 0;

    const processedItems = items.map(item => {
      const qty = Math.max(0, Number(item.quantity) || 0);
      const price = Math.max(0, Number(item.unitPrice) || 0);
      const taxPct = Math.max(0, Number(item.taxPercent) || 0);
      const itemSub = Math.round(qty * price * 100) / 100;
      const itemTax = Math.round(itemSub * (taxPct / 100) * 100) / 100;
      const lineTotal = Math.round((itemSub + itemTax) * 100) / 100;

      subTotal += itemSub;
      taxTotal += itemTax;

      return {
        inventoryItemId: item.inventoryItemId || null,
        itemName: (item.itemName || '').trim(),
        quantity: qty,
        receivedQuantity: 0,
        uom: item.uom || 'kg',
        unitPrice: price,
        taxPercent: taxPct,
        lineTotal
      };
    });

    subTotal = Math.round(subTotal * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;
    const grandTotal = Math.round((subTotal + taxTotal) * 100) / 100;

    const po = await RestaurantPurchaseOrder.create({
      organizationId,
      poNumber: generatedPoNumber,
      vendorId,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      status: 'ORDERED',
      items: processedItems,
      subTotal,
      taxTotal,
      grandTotal,
      notes: notes || '',
      createdBy: req.user._id
    });

    const populated = await RestaurantPurchaseOrder.findById(po._id)
      .populate('vendorId', 'name code phone gstin paymentTerms')
      .populate('createdBy', 'name');

    res.status(201).json({
      status: 'success',
      data: { purchaseOrder: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'ORDERED', 'CANCELLED'].includes(status)) {
      return next(new AppError('Invalid status update', 400));
    }

    const po = await RestaurantPurchaseOrder.findOneAndUpdate(
      { _id: id, organizationId },
      { status },
      { new: true }
    ).populate('vendorId', 'name code phone');

    if (!po) {
      return next(new AppError('Purchase order not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { purchaseOrder: po }
    });
  } catch (error) {
    next(error);
  }
};

export const recordGrnReceipt = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const {
      invoiceNo = '',
      invoiceAmount = 0,
      notes = '',
      itemsReceived = [] // [{ inventoryItemId, itemName, receivedQuantity, unitPrice, uom }]
    } = req.body;

    const po = await RestaurantPurchaseOrder.findOne({ _id: id, organizationId });
    if (!po) {
      return next(new AppError('Purchase order not found', 404));
    }

    if (po.status === 'CANCELLED') {
      return next(new AppError('Cannot receive items for a cancelled purchase order', 400));
    }

    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;
    const receivedItemsRecord = [];

    // Process each item received
    for (const rec of itemsReceived) {
      const qtyReceived = Math.max(0, Number(rec.receivedQuantity) || 0);
      if (qtyReceived <= 0) continue;

      // Update PO items receivedQuantity
      const poItem = po.items.find(pi => 
        (pi.inventoryItemId && rec.inventoryItemId && pi.inventoryItemId.toString() === rec.inventoryItemId.toString()) ||
        pi.itemName.toLowerCase() === (rec.itemName || '').toLowerCase()
      );

      if (poItem) {
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + qtyReceived;
      }

      receivedItemsRecord.push({
        itemName: rec.itemName,
        inventoryItemId: rec.inventoryItemId || null,
        receivedQuantity: qtyReceived,
        uom: rec.uom || 'kg',
        unitPrice: Number(rec.unitPrice) || 0
      });

      // AUTO-UPDATE RAW INVENTORY & CREATE AUDIT LOG
      if (rec.inventoryItemId) {
        const invItem = await RestaurantInventoryItem.findOne({ 
          _id: rec.inventoryItemId, 
          organizationId 
        });

        if (invItem) {
          const prevStock = invItem.currentStock || 0;
          const newStock = prevStock + qtyReceived;
          const costImpact = Math.round(qtyReceived * (Number(rec.unitPrice) || invItem.unitCost || 0) * 100) / 100;

          invItem.currentStock = newStock;
          if (rec.unitPrice && Number(rec.unitPrice) > 0) {
            invItem.unitCost = Number(rec.unitPrice);
          }
          invItem.totalValue = Math.round(newStock * invItem.unitCost * 100) / 100;
          await invItem.save();

          // Create Inward Log
          await RestaurantInventoryLog.create({
            organizationId,
            inventoryItemId: invItem._id,
            type: 'INWARD',
            quantityChange: qtyReceived,
            previousStock: prevStock,
            newStock,
            unitCost: invItem.unitCost,
            totalCostImpact: costImpact,
            referenceNo: `${po.poNumber} / ${grnNumber}`,
            reason: `Supplier GRN Inward (Invoice: ${invoiceNo || 'N/A'})`,
            performedBy: req.user._id
          });
        }
      }
    }

    // Append GRN to PO
    po.grnReceipts.push({
      grnNumber,
      receivedAt: new Date(),
      receivedBy: req.user._id,
      invoiceNo: invoiceNo ? invoiceNo.trim() : '',
      invoiceAmount: Number(invoiceAmount) || 0,
      notes: notes || '',
      itemsReceived: receivedItemsRecord
    });

    // Determine new PO status
    const allFullyReceived = po.items.every(item => (item.receivedQuantity || 0) >= item.quantity);
    po.status = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

    await po.save();

    // Update Vendor outstanding balance
    if (po.vendorId && Number(invoiceAmount) > 0) {
      await RestaurantVendor.findByIdAndUpdate(po.vendorId, {
        $inc: {
          outstandingBalance: Number(invoiceAmount),
          totalPurchasedAmount: Number(invoiceAmount)
        }
      });
    }

    const populatedPO = await RestaurantPurchaseOrder.findById(po._id)
      .populate('vendorId', 'name code phone gstin paymentTerms')
      .populate('createdBy', 'name')
      .populate('grnReceipts.receivedBy', 'name');

    res.status(200).json({
      status: 'success',
      data: { purchaseOrder: populatedPO, grnNumber }
    });
  } catch (error) {
    next(error);
  }
};

export const recordVendorPayment = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { amount, paymentMethod = 'BANK_TRANSFER' } = req.body;

    const po = await RestaurantPurchaseOrder.findOne({ _id: id, organizationId });
    if (!po) {
      return next(new AppError('Purchase order not found', 404));
    }

    const payAmount = Math.max(0, Number(amount) || 0);
    po.paidAmount = (po.paidAmount || 0) + payAmount;
    po.paymentMethod = paymentMethod;

    if (po.paidAmount >= po.grandTotal) {
      po.paymentStatus = 'PAID';
    } else if (po.paidAmount > 0) {
      po.paymentStatus = 'PARTIALLY_PAID';
    }

    await po.save();

    // Reduce vendor outstanding balance
    if (po.vendorId && payAmount > 0) {
      await RestaurantVendor.findByIdAndUpdate(po.vendorId, {
        $inc: { outstandingBalance: -payAmount }
      });
    }

    const populated = await RestaurantPurchaseOrder.findById(po._id)
      .populate('vendorId', 'name code phone outstandingBalance');

    res.status(200).json({
      status: 'success',
      data: { purchaseOrder: populated }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 13. CUSTOMER CRM, GUEST HISTORY & LOYALTY
// ==========================================

export const getCustomerAnalytics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const customers = await RestaurantCustomer.find({ organizationId, isActive: true });

    const totalCustomers = customers.length;
    let totalSpendSum = 0;
    let totalLoyaltyPoints = 0;
    let repeatGuestsCount = 0;
    let vipCount = 0;

    customers.forEach(c => {
      totalSpendSum += c.totalSpend || 0;
      totalLoyaltyPoints += c.loyaltyPoints || 0;
      if ((c.totalVisits || 0) > 1) repeatGuestsCount++;
      if (['GOLD', 'PLATINUM'].includes(c.vipTier)) vipCount++;
    });

    const averageLifetimeValue = totalCustomers > 0 
      ? Math.round((totalSpendSum / totalCustomers) * 100) / 100 
      : 0;

    const repeatRate = totalCustomers > 0 
      ? Math.round((repeatGuestsCount / totalCustomers) * 100) 
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalCustomers,
          repeatGuestsCount,
          repeatRate,
          vipCount,
          totalLoyaltyPoints,
          averageLifetimeValue,
          totalCumulativeRevenue: Math.round(totalSpendSum * 100) / 100
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, tier, dietaryPreference, sortBy = 'totalSpend' } = req.query;

    let query = { organizationId, isActive: true };
    if (tier && tier !== 'ALL') {
      query.vipTier = tier;
    }
    if (dietaryPreference && dietaryPreference !== 'ALL') {
      query.dietaryPreferences = dietaryPreference;
    }

    let sortOption = { totalSpend: -1 };
    if (sortBy === 'visits') sortOption = { totalVisits: -1 };
    else if (sortBy === 'lastVisit') sortOption = { lastVisitDate: -1 };
    else if (sortBy === 'name') sortOption = { name: 1 };
    else if (sortBy === 'points') sortOption = { loyaltyPoints: -1 };

    const customers = await RestaurantCustomer.find(query).sort(sortOption);

    let filtered = customers;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      status: 'success',
      data: { customers: filtered }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const customer = await RestaurantCustomer.findOne({ _id: id, organizationId });
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // Find dining history: orders matching this customer's phone or name
    const diningHistory = await RestaurantOrder.find({
      organizationId,
      $or: [
        { customerPhone: customer.phone },
        { customerName: customer.name }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20);

    res.status(200).json({
      status: 'success',
      data: { customer, diningHistory }
    });
  } catch (error) {
    next(error);
  }
};

export const lookupCustomerByPhone = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { phone } = req.query;

    if (!phone || !phone.trim()) {
      return res.status(200).json({ status: 'success', data: { customer: null } });
    }

    const customer = await RestaurantCustomer.findOne({ 
      organizationId, 
      phone: phone.trim(),
      isActive: true 
    });

    res.status(200).json({
      status: 'success',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name,
      phone,
      email,
      birthday,
      anniversary,
      vipTier = 'STANDARD',
      loyaltyPoints = 0,
      totalVisits = 1,
      totalSpend = 0,
      dietaryPreferences = [],
      notes = ''
    } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Guest name is required', 400));
    }
    if (!phone || !phone.trim()) {
      return next(new AppError('Guest phone number is required', 400));
    }

    const cleanPhone = phone.trim();
    const existing = await RestaurantCustomer.findOne({ organizationId, phone: cleanPhone });
    if (existing) {
      return next(new AppError('A guest with this phone number already exists in your directory', 400));
    }

    const spend = Math.max(0, Number(totalSpend) || 0);
    const visits = Math.max(1, Number(totalVisits) || 1);
    const avgSpend = Math.round((spend / visits) * 100) / 100;

    let calculatedTier = vipTier;
    const pts = Math.max(0, Number(loyaltyPoints) || 0);
    if (calculatedTier === 'STANDARD') {
      if (pts >= 500 || spend >= 25000) calculatedTier = 'PLATINUM';
      else if (pts >= 200 || spend >= 10000) calculatedTier = 'GOLD';
      else if (pts >= 50 || spend >= 3000) calculatedTier = 'SILVER';
    }

    const customer = await RestaurantCustomer.create({
      organizationId,
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : '',
      birthday: birthday ? new Date(birthday) : null,
      anniversary: anniversary ? new Date(anniversary) : null,
      vipTier: calculatedTier,
      loyaltyPoints: pts,
      totalVisits: visits,
      totalSpend: spend,
      averageSpendPerVisit: avgSpend,
      lastVisitDate: new Date(),
      dietaryPreferences,
      notes: notes ? notes.trim() : '',
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      birthday,
      anniversary,
      vipTier,
      loyaltyPoints,
      totalVisits,
      totalSpend,
      dietaryPreferences,
      notes,
      isActive
    } = req.body;

    const customer = await RestaurantCustomer.findOne({ _id: id, organizationId });
    if (!customer) {
      return next(new AppError('Guest not found', 404));
    }

    if (name !== undefined) customer.name = name.trim();
    if (phone !== undefined) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email.trim();
    if (birthday !== undefined) customer.birthday = birthday ? new Date(birthday) : null;
    if (anniversary !== undefined) customer.anniversary = anniversary ? new Date(anniversary) : null;
    if (vipTier !== undefined) customer.vipTier = vipTier;
    if (dietaryPreferences !== undefined) customer.dietaryPreferences = dietaryPreferences;
    if (notes !== undefined) customer.notes = notes;
    if (isActive !== undefined) customer.isActive = Boolean(isActive);

    if (totalVisits !== undefined) customer.totalVisits = Math.max(1, Number(totalVisits));
    if (totalSpend !== undefined) customer.totalSpend = Math.max(0, Number(totalSpend));
    if (loyaltyPoints !== undefined) customer.loyaltyPoints = Math.max(0, Number(loyaltyPoints));

    customer.averageSpendPerVisit = Math.round((customer.totalSpend / customer.totalVisits) * 100) / 100;

    await customer.save();

    res.status(200).json({
      status: 'success',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const customer = await RestaurantCustomer.findOne({ _id: id, organizationId });
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    customer.isActive = false;
    await customer.save();

    res.status(200).json({
      status: 'success',
      message: 'Guest profile archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 12. OPERATING EXPENSES & KITCHEN OVERHEADS
// ==========================================

const seedRestaurantExpenses = async (organizationId, userId) => {
  const count = await RestaurantExpense.countDocuments({ organizationId });
  if (count > 0) return;

  const now = new Date();
  const d = (daysAgo) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  const sampleExpenses = [
    {
      expenseNumber: 'EXP-2026-0001',
      category: 'LPG_GAS',
      title: '3x 19kg Commercial LPG Cylinders Refill',
      amount: 5400,
      taxAmount: 270,
      totalAmount: 5670,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      expenseDate: d(1),
      vendorOrPayee: 'Shree Balaji Commercial Gas Agency',
      invoiceNumber: 'SBG/26/8941',
      paidBy: 'Store Manager',
      notes: 'Tandoor and 4-burner commercial range gas delivery',
      isRecurring: true,
      recurringFrequency: 'WEEKLY',
      status: 'APPROVED'
    },
    {
      expenseNumber: 'EXP-2026-0002',
      category: 'UTILITIES',
      title: 'Commercial Electricity & Power Bill (Kitchen + AC Family Dining)',
      amount: 18450,
      taxAmount: 922.5,
      totalAmount: 19372.5,
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAID',
      expenseDate: d(5),
      vendorOrPayee: 'State Electricity Distribution Co.',
      invoiceNumber: 'EB-MAR-78401',
      paidBy: 'Operations Lead',
      notes: 'Monthly power consumption for HVAC, chillers & walk-in freezer',
      isRecurring: true,
      recurringFrequency: 'MONTHLY',
      status: 'APPROVED'
    },
    {
      expenseNumber: 'EXP-2026-0003',
      category: 'PACKAGING_DISPOSABLES',
      title: '500x 3-Compartment Meal Trays, Paper Bags & Foil Cartons',
      amount: 6200,
      taxAmount: 310,
      totalAmount: 6510,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      expenseDate: d(3),
      vendorOrPayee: 'EcoPack India Disposables',
      invoiceNumber: 'EPI-9942',
      paidBy: 'Store Manager',
      notes: 'Takeaway food grade packaging inventory replenishment',
      isRecurring: false,
      status: 'APPROVED'
    },
    {
      expenseNumber: 'EXP-2026-0004',
      category: 'CLEANING_HYGIENE',
      title: 'Dishwashing Detergent, Degreaser & Kitchen Floor Sanitizer',
      amount: 3850,
      taxAmount: 192.5,
      totalAmount: 4042.5,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      expenseDate: d(2),
      vendorOrPayee: 'Apex Clean Hygiene Solutions',
      invoiceNumber: 'ACHS-3120',
      paidBy: 'Head Chef',
      notes: 'Kitchen deep cleaning chemicals and exhaust hood degreaser',
      isRecurring: true,
      recurringFrequency: 'MONTHLY',
      status: 'APPROVED'
    },
    {
      expenseNumber: 'EXP-2026-0005',
      category: 'MAINTENANCE_REPAIRS',
      title: 'Walk-In Chiller Compressor Servicing & Thermostat Calibration',
      amount: 4500,
      taxAmount: 0,
      totalAmount: 4500,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      expenseDate: d(4),
      vendorOrPayee: 'CoolMaster Refrigeration Services',
      invoiceNumber: 'CM-SERV-104',
      paidBy: 'Store Manager',
      notes: 'Chiller temperature maintained at 2.5°C after refrigerant top-up',
      isRecurring: false,
      status: 'APPROVED'
    },
    {
      expenseNumber: 'EXP-2026-0006',
      category: 'STAFF_WELFARE_MEALS',
      title: 'Staff Family Meal Provisions & Daily Tea/Coffee Supplies',
      amount: 4200,
      taxAmount: 0,
      totalAmount: 4200,
      paymentMethod: 'PETTY_CASH',
      paymentStatus: 'PAID',
      expenseDate: d(0),
      vendorOrPayee: 'Local Provision Store',
      invoiceNumber: 'PETTY-014',
      paidBy: 'Cashier / Shift Lead',
      notes: 'Daily food ration for culinary crew and floor stewards',
      isRecurring: true,
      recurringFrequency: 'WEEKLY',
      status: 'APPROVED'
    },
    {
      expenseNumber: 'EXP-2026-0007',
      category: 'LICENSES_PERMITS',
      title: 'FSSAI Food Business Annual License Renewal & Fire Safety Audit',
      amount: 7500,
      taxAmount: 0,
      totalAmount: 7500,
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PENDING',
      expenseDate: d(7),
      vendorOrPayee: 'Food Safety Compliance Advisory',
      invoiceNumber: 'FSA-2026-11',
      paidBy: 'Accounts Dept',
      notes: 'Statutory compliance renewal for restaurant operating permit',
      isRecurring: true,
      recurringFrequency: 'YEARLY',
      status: 'APPROVED'
    },
    {
      expenseNumber: 'EXP-2026-0008',
      category: 'PETTY_CASH',
      title: 'Spot Cash: Fresh Mint, Lemons, Ginger & Hand Wash Refill',
      amount: 680,
      taxAmount: 0,
      totalAmount: 680,
      paymentMethod: 'PETTY_CASH',
      paymentStatus: 'PAID',
      expenseDate: d(0),
      vendorOrPayee: 'Sabzi Mandi Cash Vendor',
      invoiceNumber: 'VOUCHER-08',
      paidBy: 'Chef Assistant',
      notes: 'Emergency bar garnish & mocktail supplies',
      isRecurring: false,
      status: 'APPROVED'
    }
  ];

  for (const exp of sampleExpenses) {
    await RestaurantExpense.create({
      ...exp,
      organizationId,
      recordedBy: userId || null
    });
  }
};

export const getExpenseAnalytics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    await seedRestaurantExpenses(organizationId, req.user._id);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const expenses = await RestaurantExpense.find({ organizationId, isActive: true });

    let totalThisMonth = 0;
    let totalToday = 0;
    let totalPrevMonth = 0;
    let pendingUnpaidAmount = 0;
    let pendingUnpaidCount = 0;
    let recurringCount = 0;

    const categoryMap = {};
    const paymentMethodMap = {};

    expenses.forEach(exp => {
      const expDate = new Date(exp.expenseDate);
      const amt = Number(exp.totalAmount) || 0;

      // Category breakdown
      if (!categoryMap[exp.category]) {
        categoryMap[exp.category] = { category: exp.category, totalAmount: 0, count: 0 };
      }
      categoryMap[exp.category].totalAmount += amt;
      categoryMap[exp.category].count += 1;

      // Payment method breakdown
      const pm = exp.paymentMethod || 'CASH';
      if (!paymentMethodMap[pm]) {
        paymentMethodMap[pm] = { method: pm, totalAmount: 0, count: 0 };
      }
      paymentMethodMap[pm].totalAmount += amt;
      paymentMethodMap[pm].count += 1;

      // Time aggregates
      if (expDate >= startOfToday) {
        totalToday += amt;
      }
      if (expDate >= startOfMonth) {
        totalThisMonth += amt;
      } else if (expDate >= startOfPrevMonth && expDate < startOfMonth) {
        totalPrevMonth += amt;
      }

      // Unpaid pending
      if (exp.paymentStatus === 'PENDING') {
        pendingUnpaidAmount += amt;
        pendingUnpaidCount += 1;
      }

      if (exp.isRecurring) {
        recurringCount += 1;
      }
    });

    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.totalAmount - a.totalAmount);
    const paymentMethodBreakdown = Object.values(paymentMethodMap).sort((a, b) => b.totalAmount - a.totalAmount);
    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    // Daily expense trend over last 14 days
    const dailyTrend = [];
    for (let i = 13; i >= 0; i--) {
      const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayLabel = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const nextDay = new Date(dayDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayTotal = expenses
        .filter(e => {
          const ed = new Date(e.expenseDate);
          return ed >= dayDate && ed < nextDay;
        })
        .reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);

      dailyTrend.push({ date: dayLabel, total: Math.round(dayTotal * 100) / 100 });
    }

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalThisMonth: Math.round(totalThisMonth * 100) / 100,
          totalToday: Math.round(totalToday * 100) / 100,
          totalPrevMonth: Math.round(totalPrevMonth * 100) / 100,
          pendingUnpaidAmount: Math.round(pendingUnpaidAmount * 100) / 100,
          pendingUnpaidCount,
          totalExpensesCount: expenses.length,
          recurringCount,
          topCategory: topCategory ? topCategory.category : 'N/A',
          topCategoryAmount: topCategory ? Math.round(topCategory.totalAmount * 100) / 100 : 0
        },
        categoryBreakdown,
        paymentMethodBreakdown,
        dailyTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    await seedRestaurantExpenses(organizationId, req.user._id);

    const { category, paymentMethod, paymentStatus, search, startDate, endDate, sortBy = 'expenseDate' } = req.query;

    let query = { organizationId, isActive: true };

    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (paymentMethod && paymentMethod !== 'ALL') {
      query.paymentMethod = paymentMethod;
    }
    if (paymentStatus && paymentStatus !== 'ALL') {
      query.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = end;
      }
    }

    let sortOptions = { expenseDate: -1 };
    if (sortBy === 'amount') sortOptions = { totalAmount: -1 };
    else if (sortBy === 'createdAt') sortOptions = { createdAt: -1 };
    else if (sortBy === 'title') sortOptions = { title: 1 };

    const expenses = await RestaurantExpense.find(query)
      .populate('recordedBy', 'name email')
      .sort(sortOptions);

    let filtered = expenses;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(e => 
        e.title?.toLowerCase().includes(q) ||
        e.expenseNumber?.toLowerCase().includes(q) ||
        e.vendorOrPayee?.toLowerCase().includes(q) ||
        e.invoiceNumber?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        expenses: filtered,
        total: filtered.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const expense = await RestaurantExpense.findOne({ _id: id, organizationId, isActive: true })
      .populate('recordedBy', 'name email');

    if (!expense) {
      return next(new AppError('Expense record not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      category = 'OTHER',
      title,
      amount,
      taxAmount = 0,
      paymentMethod = 'CASH',
      paymentStatus = 'PAID',
      expenseDate,
      vendorOrPayee = '',
      invoiceNumber = '',
      receiptAttachmentUrl = '',
      paidBy = 'Manager',
      notes = '',
      isRecurring = false,
      recurringFrequency = 'NONE',
      status = 'APPROVED'
    } = req.body;

    if (!title || !title.trim()) {
      return next(new AppError('Expense title/description is required', 400));
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return next(new AppError('A valid expense amount is required', 400));
    }

    const numTax = Math.max(0, Number(taxAmount) || 0);
    const totalAmount = Math.round((numAmount + numTax) * 100) / 100;

    const count = await RestaurantExpense.countDocuments({ organizationId });
    const year = new Date().getFullYear();
    const expenseNumber = `EXP-${year}-${String(count + 1).padStart(4, '0')}`;

    const expense = await RestaurantExpense.create({
      organizationId,
      expenseNumber,
      category,
      title: title.trim(),
      amount: numAmount,
      taxAmount: numTax,
      totalAmount,
      paymentMethod,
      paymentStatus,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      vendorOrPayee: vendorOrPayee ? vendorOrPayee.trim() : '',
      invoiceNumber: invoiceNumber ? invoiceNumber.trim() : '',
      receiptAttachmentUrl: receiptAttachmentUrl ? receiptAttachmentUrl.trim() : '',
      recordedBy: req.user._id,
      paidBy: paidBy ? paidBy.trim() : 'Manager',
      notes: notes ? notes.trim() : '',
      isRecurring: Boolean(isRecurring),
      recurringFrequency: isRecurring ? recurringFrequency : 'NONE',
      status,
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const {
      category,
      title,
      amount,
      taxAmount,
      paymentMethod,
      paymentStatus,
      expenseDate,
      vendorOrPayee,
      invoiceNumber,
      receiptAttachmentUrl,
      paidBy,
      notes,
      isRecurring,
      recurringFrequency,
      status
    } = req.body;

    const expense = await RestaurantExpense.findOne({ _id: id, organizationId, isActive: true });
    if (!expense) {
      return next(new AppError('Expense record not found', 404));
    }

    if (title !== undefined) expense.title = title.trim();
    if (category !== undefined) expense.category = category;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (paymentStatus !== undefined) expense.paymentStatus = paymentStatus;
    if (expenseDate !== undefined) expense.expenseDate = new Date(expenseDate);
    if (vendorOrPayee !== undefined) expense.vendorOrPayee = vendorOrPayee.trim();
    if (invoiceNumber !== undefined) expense.invoiceNumber = invoiceNumber.trim();
    if (receiptAttachmentUrl !== undefined) expense.receiptAttachmentUrl = receiptAttachmentUrl.trim();
    if (paidBy !== undefined) expense.paidBy = paidBy.trim();
    if (notes !== undefined) expense.notes = notes.trim();
    if (status !== undefined) expense.status = status;

    if (isRecurring !== undefined) {
      expense.isRecurring = Boolean(isRecurring);
      if (expense.isRecurring && recurringFrequency) {
        expense.recurringFrequency = recurringFrequency;
      } else if (!expense.isRecurring) {
        expense.recurringFrequency = 'NONE';
      }
    }

    let recalculateTotal = false;
    if (amount !== undefined) {
      expense.amount = Math.max(0, Number(amount) || 0);
      recalculateTotal = true;
    }
    if (taxAmount !== undefined) {
      expense.taxAmount = Math.max(0, Number(taxAmount) || 0);
      recalculateTotal = true;
    }
    if (recalculateTotal) {
      expense.totalAmount = Math.round((expense.amount + expense.taxAmount) * 100) / 100;
    }

    await expense.save();

    res.status(200).json({
      status: 'success',
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const expense = await RestaurantExpense.findOne({ _id: id, organizationId });
    if (!expense) {
      return next(new AppError('Expense record not found', 404));
    }

    expense.isActive = false;
    await expense.save();

    res.status(200).json({
      status: 'success',
      message: 'Expense voucher archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 13. FINANCIAL REPORTS & PROFIT & LOSS (P&L)
// ==========================================

const seedHistoricalRestaurantOrdersAndBills = async (organizationId, userId) => {
  const billCount = await RestaurantBill.countDocuments({ organizationId });
  if (billCount >= 15) return;

  const menuItems = await RestaurantMenuItem.find({ organizationId, isAvailable: true });
  if (!menuItems || menuItems.length === 0) return;

  const now = new Date();
  
  for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
    const billDate = new Date(now);
    billDate.setDate(billDate.getDate() - daysAgo);

    // 2-3 bills per weekday, 4 on weekends
    const dayOfWeek = billDate.getDay();
    const billsForDay = (dayOfWeek === 0 || dayOfWeek === 6) ? 4 : 2;

    for (let b = 0; b < billsForDay; b++) {
      const orderHour = (b % 2 === 0) ? 13 : 20;
      billDate.setHours(orderHour, Math.floor(Math.random() * 50), 0, 0);

      const numItems = Math.floor(Math.random() * 3) + 2;
      const selectedItems = [];
      let subTotal = 0;

      for (let i = 0; i < numItems; i++) {
        const item = menuItems[(daysAgo * 3 + b + i) % menuItems.length];
        const qty = Math.floor(Math.random() * 2) + 1;
        const price = item.price || 260;
        const itemTotal = price * qty;
        subTotal += itemTotal;

        selectedItems.push({
          menuItemId: item._id,
          name: item.name,
          price: price,
          quantity: qty,
          station: item.category || 'Kitchen',
          veg: Boolean(item.isVeg),
          status: 'SERVED',
          ready: true,
          readyAt: billDate
        });
      }

      const discount = (daysAgo % 4 === 0) ? Math.round(subTotal * 0.1) : 0;
      const serviceCharge = (daysAgo % 3 === 0) ? Math.round(subTotal * 0.05) : 0;
      const taxable = subTotal - discount + serviceCharge;
      const cgst = Math.round(taxable * 0.025 * 100) / 100;
      const sgst = Math.round(taxable * 0.025 * 100) / 100;
      const grandTotal = Math.round(taxable + cgst + sgst);

      const orderType = (b === 0) ? 'DINE_IN' : (b === 1 ? 'TAKEAWAY' : 'DELIVERY');
      const paymentMethod = (daysAgo % 3 === 0) ? 'UPI' : (daysAgo % 3 === 1 ? 'CARD' : 'CASH');

      // Create Order
      const order = await RestaurantOrder.create({
        organizationId,
        orderNumber: `ORD-${billDate.getFullYear()}${String(billDate.getMonth()+1).padStart(2,'0')}-${String(daysAgo*10+b).padStart(4,'0')}`,
        orderType,
        tableName: orderType === 'DINE_IN' ? `T-${(b % 10) + 1}` : undefined,
        guestCount: orderType === 'DINE_IN' ? Math.floor(Math.random() * 3) + 2 : 1,
        customerName: `Guest ${daysAgo * 10 + b}`,
        items: selectedItems,
        subTotal,
        discount,
        serviceCharge,
        taxTotal: cgst + sgst,
        totalAmount: grandTotal,
        status: 'COMPLETED',
        createdAt: billDate,
        updatedAt: billDate
      });

      // Create Bill
      await RestaurantBill.create({
        organizationId,
        billNumber: `BILL-${billDate.getFullYear()}${String(billDate.getMonth()+1).padStart(2,'0')}-${String(daysAgo*10+b).padStart(4,'0')}`,
        orderId: order._id,
        subTotal,
        discount,
        serviceCharge,
        cgst,
        sgst,
        grandTotal,
        paymentStatus: 'PAID',
        paymentSplits: [{ method: paymentMethod, amount: grandTotal }],
        paidAmount: grandTotal,
        invoiceDate: billDate,
        settledBy: userId || null,
        createdAt: billDate,
        updatedAt: billDate
      });
    }
  }
};

const resolveDateRange = (period, startDate, endDate) => {
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'quarter') {
    start = new Date(now);
    start.setDate(start.getDate() - 90);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

export const getFinancialPnlReport = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    await seedHistoricalRestaurantOrdersAndBills(organizationId, req.user._id);

    const { period = 'month', startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(period, startDate, endDate);

    // 1. Fetch settled bills in date range with populated order details
    const bills = await RestaurantBill.find({
      organizationId,
      paymentStatus: 'PAID',
      invoiceDate: { $gte: start, $lte: end }
    }).populate('orderId');

    // 2. Fetch expenses in date range
    const expenses = await RestaurantExpense.find({
      organizationId,
      isActive: true,
      expenseDate: { $gte: start, $lte: end }
    });

    // 3. Fetch recipes for accurate BOM costing
    const recipes = await RestaurantRecipe.find({ organizationId, isActive: true });
    const recipeCostMap = new Map();
    recipes.forEach(r => {
      if (r.menuItemId) recipeCostMap.set(String(r.menuItemId), Number(r.costPerPortion) || 0);
      if (r.name) recipeCostMap.set(r.name.toLowerCase().trim(), Number(r.costPerPortion) || 0);
    });

    // 4. Fetch inventory spoilage losses
    const spoilageLogs = await RestaurantInventoryLog.find({
      organizationId,
      logType: 'WASTAGE_SPOILAGE',
      createdAt: { $gte: start, $lte: end }
    });
    const spoilageLoss = spoilageLogs.reduce((acc, log) => acc + (Number(log.totalCost) || 0), 0);

    // 5. Aggregate Revenue Metrics
    let grossFoodSales = 0;
    let grossBeverageSales = 0;
    let discountsTotal = 0;
    let serviceChargeTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let grandTotalRevenue = 0;

    const paymentMethodMap = { CASH: 0, UPI: 0, CARD: 0, OTHER: 0 };
    const channelMap = {
      DINE_IN: { name: 'Dine-In Table Service', sales: 0, orders: 0, covers: 0 },
      TAKEAWAY: { name: 'Direct Counter Takeaway', sales: 0, orders: 0, covers: 0 },
      DELIVERY: { name: 'Direct Delivery Orders', sales: 0, orders: 0, covers: 0 }
    };

    let totalIngredientCost = 0;
    const itemSalesMap = new Map();

    bills.forEach(bill => {
      const sub = Number(bill.subTotal) || 0;
      const disc = Number(bill.discount) || 0;
      const sc = Number(bill.serviceCharge) || 0;
      const c = Number(bill.cgst) || 0;
      const s = Number(bill.sgst) || 0;
      const gt = Number(bill.grandTotal) || 0;

      grossFoodSales += sub;
      discountsTotal += disc;
      serviceChargeTotal += sc;
      cgstTotal += c;
      sgstTotal += s;
      grandTotalRevenue += gt;

      // Payment methods
      if (bill.paymentSplits && bill.paymentSplits.length > 0) {
        bill.paymentSplits.forEach(ps => {
          const m = ps.method || 'CASH';
          if (paymentMethodMap[m] !== undefined) paymentMethodMap[m] += (Number(ps.amount) || 0);
          else paymentMethodMap.OTHER += (Number(ps.amount) || 0);
        });
      } else {
        paymentMethodMap.CASH += gt;
      }

      // Order channel and items
      const ord = bill.orderId;
      if (ord) {
        const type = ord.orderType || 'DINE_IN';
        if (channelMap[type]) {
          channelMap[type].sales += (sub - disc + sc);
          channelMap[type].orders += 1;
          channelMap[type].covers += (Number(ord.guestCount) || 1);
        }

        if (ord.items && ord.items.length > 0) {
          ord.items.forEach(item => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const itemRevenue = price * qty;

            // BOM costing
            let unitCost = 0;
            if (item.menuItemId && recipeCostMap.has(String(item.menuItemId))) {
              unitCost = recipeCostMap.get(String(item.menuItemId));
            } else if (item.name && recipeCostMap.has(item.name.toLowerCase().trim())) {
              unitCost = recipeCostMap.get(item.name.toLowerCase().trim());
            } else {
              // 30.5% standard restaurant food cost model benchmark
              unitCost = price * 0.305;
            }
            totalIngredientCost += (unitCost * qty);

            // Item frequency aggregation
            const key = item.name || 'Special';
            if (!itemSalesMap.has(key)) {
              itemSalesMap.set(key, { name: key, quantity: 0, revenue: 0, cost: 0, isVeg: item.veg });
            }
            const existing = itemSalesMap.get(key);
            existing.quantity += qty;
            existing.revenue += itemRevenue;
            existing.cost += (unitCost * qty);
          });
        }
      }
    });

    const netSales = Math.round((grossFoodSales - discountsTotal + serviceChargeTotal) * 100) / 100;
    const taxesCollected = Math.round((cgstTotal + sgstTotal) * 100) / 100;
    const ordersCount = bills.length;
    const averageCheckSize = ordersCount > 0 ? Math.round((netSales / ordersCount) * 100) / 100 : 0;

    // 6. Cost of Goods Sold (COGS)
    const totalCogs = Math.round((totalIngredientCost + spoilageLoss) * 100) / 100;
    const foodCostPercentage = netSales > 0 ? Math.round((totalCogs / netSales) * 1000) / 10 : 0;
    const foodCostStatus = foodCostPercentage <= 32 ? 'OPTIMAL' : foodCostPercentage <= 36 ? 'ACCEPTABLE' : 'HIGH_ALERT';

    // 7. Gross Margin
    const grossProfit = Math.round((netSales - totalCogs) * 100) / 100;
    const grossMarginPercentage = netSales > 0 ? Math.round((grossProfit / netSales) * 1000) / 10 : 0;

    // 8. Operating Overheads (Opex Breakdown)
    const opexBreakdown = {
      lpgGasFuel: 0,
      utilitiesPowerWater: 0,
      packagingDisposables: 0,
      cleaningHygiene: 0,
      maintenanceRepairs: 0,
      staffWelfareMeals: 0,
      marketingPromotions: 0,
      licensesPermits: 0,
      pettyCashMisc: 0
    };

    expenses.forEach(exp => {
      const amt = Number(exp.totalAmount) || 0;
      switch (exp.category) {
        case 'LPG_GAS': opexBreakdown.lpgGasFuel += amt; break;
        case 'UTILITIES': opexBreakdown.utilitiesPowerWater += amt; break;
        case 'PACKAGING_DISPOSABLES': opexBreakdown.packagingDisposables += amt; break;
        case 'CLEANING_HYGIENE': opexBreakdown.cleaningHygiene += amt; break;
        case 'MAINTENANCE_REPAIRS': opexBreakdown.maintenanceRepairs += amt; break;
        case 'STAFF_WELFARE_MEALS': opexBreakdown.staffWelfareMeals += amt; break;
        case 'MARKETING_PROMOTIONS': opexBreakdown.marketingPromotions += amt; break;
        case 'LICENSES_PERMITS': opexBreakdown.licensesPermits += amt; break;
        default: opexBreakdown.pettyCashMisc += amt; break;
      }
    });

    const totalOpex = Math.round(Object.values(opexBreakdown).reduce((a, b) => a + b, 0) * 100) / 100;
    const opexPercentage = netSales > 0 ? Math.round((totalOpex / netSales) * 1000) / 10 : 0;

    // 9. Operating EBITDA & Net Profit
    const operatingEbitda = Math.round((grossProfit - totalOpex) * 100) / 100;
    const netProfit = operatingEbitda;
    const netMarginPercentage = netSales > 0 ? Math.round((netProfit / netSales) * 1000) / 10 : 0;

    // 10. Daily Waterfall Trend Matrix (for multi-series charts)
    const daysDiff = Math.max(1, Math.min(31, Math.ceil((end - start) / (1000 * 60 * 60 * 24))));
    const dailyTrend = [];

    for (let d = 0; d < daysDiff; d++) {
      const curDate = new Date(start);
      curDate.setDate(curDate.getDate() + d);
      const nextDate = new Date(curDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayBills = bills.filter(b => {
        const bd = new Date(b.invoiceDate || b.createdAt);
        return bd >= curDate && bd < nextDate;
      });

      const daySales = Math.round(dayBills.reduce((acc, b) => acc + (Number(b.subTotal - b.discount + b.serviceCharge) || 0), 0));
      const dayCogs = Math.round(daySales * (foodCostPercentage / 100 || 0.31));

      const dayExpenses = expenses.filter(e => {
        const ed = new Date(e.expenseDate);
        return ed >= curDate && ed < nextDate;
      });
      const dayOpex = Math.round(dayExpenses.reduce((acc, e) => acc + (Number(e.totalAmount) || 0), 0));
      const dayNet = daySales - dayCogs - dayOpex;

      dailyTrend.push({
        date: curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: daySales,
        cogs: dayCogs,
        opex: dayOpex,
        netProfit: dayNet
      });
    }

    // 11. Top Selling Menu Items Matrix
    const topItems = Array.from(itemSalesMap.values())
      .map(item => ({
        ...item,
        margin: Math.round((item.revenue - item.cost) * 100) / 100,
        marginPercentage: item.revenue > 0 ? Math.round(((item.revenue - item.cost) / item.revenue) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    res.status(200).json({
      status: 'success',
      data: {
        period: {
          id: period,
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        revenue: {
          grossFoodSales: Math.round(grossFoodSales * 100) / 100,
          grossBeverageSales: Math.round(grossBeverageSales * 100) / 100,
          discountsTotal: Math.round(discountsTotal * 100) / 100,
          serviceChargeTotal: Math.round(serviceChargeTotal * 100) / 100,
          taxesCollected: Math.round(taxesCollected * 100) / 100,
          netSales: Math.round(netSales * 100) / 100,
          grandTotalRevenue: Math.round(grandTotalRevenue * 100) / 100,
          ordersCount,
          averageCheckSize
        },
        cogs: {
          rawIngredientCost: Math.round(totalIngredientCost * 100) / 100,
          spoilageLoss: Math.round(spoilageLoss * 100) / 100,
          totalCogs,
          foodCostPercentage,
          status: foodCostStatus,
          benchmark: '28% - 34% (Industry Target)'
        },
        grossProfit: {
          grossProfit,
          grossMarginPercentage,
          benchmark: '66% - 72% (Healthy Restaurant Margin)'
        },
        opex: {
          ...opexBreakdown,
          totalOpex,
          opexPercentage,
          benchmark: '15% - 22% of Net Revenue'
        },
        profitability: {
          operatingEbitda,
          netProfit,
          netMarginPercentage,
          status: netProfit > 0 ? 'PROFITABLE' : 'NET_LOSS'
        },
        paymentMethods: paymentMethodMap,
        channels: Object.values(channelMap),
        dailyTrend,
        topItems
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getChannelPerformanceReport = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { period = 'month', startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(period, startDate, endDate);

    const bills = await RestaurantBill.find({
      organizationId,
      paymentStatus: 'PAID',
      invoiceDate: { $gte: start, $lte: end }
    }).populate('orderId');

    const channelStats = {
      DINE_IN: { channel: 'Dine-In', orders: 0, revenue: 0, covers: 0, avgAOV: 0, share: 0 },
      TAKEAWAY: { channel: 'Takeaway', orders: 0, revenue: 0, covers: 0, avgAOV: 0, share: 0 },
      DELIVERY: { channel: 'Delivery', orders: 0, revenue: 0, covers: 0, avgAOV: 0, share: 0 }
    };

    let totalRevenue = 0;

    bills.forEach(b => {
      const type = b.orderId?.orderType || 'DINE_IN';
      const net = (Number(b.subTotal) || 0) - (Number(b.discount) || 0) + (Number(b.serviceCharge) || 0);
      totalRevenue += net;

      if (channelStats[type]) {
        channelStats[type].orders += 1;
        channelStats[type].revenue += net;
        channelStats[type].covers += (Number(b.orderId?.guestCount) || 1);
      }
    });

    Object.values(channelStats).forEach(c => {
      c.revenue = Math.round(c.revenue * 100) / 100;
      c.avgAOV = c.orders > 0 ? Math.round((c.revenue / c.orders) * 100) / 100 : 0;
      c.share = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 1000) / 10 : 0;
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        channels: Object.values(channelStats)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDaypartAnalytics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { period = 'month', startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(period, startDate, endDate);

    const bills = await RestaurantBill.find({
      organizationId,
      paymentStatus: 'PAID',
      invoiceDate: { $gte: start, $lte: end }
    });

    const dayparts = [
      { id: 'LUNCH_RUSH', label: 'Lunch Rush (12 PM - 4 PM)', startH: 12, endH: 16, orders: 0, revenue: 0 },
      { id: 'AFTERNOON_SLACK', label: 'Afternoon Tea / Snacks (4 PM - 7 PM)', startH: 16, endH: 19, orders: 0, revenue: 0 },
      { id: 'DINNER_PRIME', label: 'Dinner Prime Peak (7 PM - 11 PM)', startH: 19, endH: 23, orders: 0, revenue: 0 },
      { id: 'LATE_NIGHT', label: 'Late Night (11 PM - 12 AM)', startH: 23, endH: 24, orders: 0, revenue: 0 }
    ];

    bills.forEach(b => {
      const dt = new Date(b.invoiceDate || b.createdAt);
      const hour = dt.getHours();
      const net = (Number(b.subTotal) || 0) - (Number(b.discount) || 0) + (Number(b.serviceCharge) || 0);

      const dp = dayparts.find(d => hour >= d.startH && hour < d.endH) || dayparts[0];
      dp.orders += 1;
      dp.revenue += net;
    });

    dayparts.forEach(d => {
      d.revenue = Math.round(d.revenue * 100) / 100;
      d.aov = d.orders > 0 ? Math.round((d.revenue / d.orders) * 100) / 100 : 0;
    });

    res.status(200).json({
      status: 'success',
      data: { dayparts }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 14. ONLINE DELIVERY AGGREGATORS (ZOMATO / SWIGGY)
// ==========================================

const getOrCreateAggregatorConfig = async (organizationId) => {
  let config = await RestaurantAggregatorConfig.findOne({ organizationId });
  if (!config) {
    config = await RestaurantAggregatorConfig.create({
      organizationId,
      zomato: { status: 'ONLINE', storeId: 'ZOM-BLR-8921', commissionRate: 20, autoAccept: true, outletRating: 4.4 },
      swiggy: { status: 'ONLINE', storeId: 'SWIG-BLR-4309', commissionRate: 22, autoAccept: true, outletRating: 4.5 },
      directWeb: { status: 'ONLINE', storeId: 'APEX-DIRECT-01', commissionRate: 0, autoAccept: true, outletRating: 4.8 },
      defaultPrepTimeMinutes: 20,
      surgeRainMode: false
    });
  }
  return config;
};

export const getAggregatorOverview = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const config = await getOrCreateAggregatorConfig(organizationId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch active delivery queue
    let activeQueue = await RestaurantOrder.find({
      organizationId,
      orderType: 'DELIVERY',
      status: { $in: ['CONFIRMED', 'PREPARING', 'READY'] }
    }).sort({ createdAt: -1 });

    // Seed 2 sample live aggregator orders if active queue is empty so the expediting board is live
    if (activeQueue.length === 0) {
      const menuItems = await RestaurantMenuItem.find({ organizationId, isAvailable: true }).limit(5);
      if (menuItems.length >= 2) {
        // Sample Zomato order
        const zItem1 = menuItems[0];
        const zItem2 = menuItems[1];
        const zSub = (zItem1.price || 280) + (zItem2.price || 320);
        const zTax = Math.round(zSub * 0.05 * 100) / 100;
        const zTotal = Math.round(zSub + zTax);
        const zComm = Math.round(zTotal * 0.20 * 100) / 100;

        await RestaurantOrder.create({
          organizationId,
          orderNumber: `ORD-DEL-${Date.now().toString().slice(-5)}1`,
          orderType: 'DELIVERY',
          aggregator: 'ZOMATO',
          aggregatorOrderId: `ZOM-${Math.floor(10000 + Math.random() * 90000)}`,
          customerName: 'Ananya Sharma',
          customerPhone: '+91 98765-XXXXX (Masked)',
          deliveryAddress: 'Flat 402, Prestige Palms, Whitefield (3.2 km)',
          cookingInstructions: 'Please make extra spicy and send extra mint chutney & cutlery.',
          items: [
            {
              menuItemId: zItem1._id,
              name: zItem1.name,
              price: zItem1.price,
              quantity: 1,
              station: zItem1.category || 'Kitchen',
              veg: Boolean(zItem1.isVeg),
              status: 'PREPARING'
            },
            {
              menuItemId: zItem2._id,
              name: zItem2.name,
              price: zItem2.price,
              quantity: 1,
              station: zItem2.category || 'Kitchen',
              veg: Boolean(zItem2.isVeg),
              status: 'PREPARING'
            }
          ],
          subTotal: zSub,
          taxTotal: zTax,
          totalAmount: zTotal,
          status: 'PREPARING',
          riderDetails: {
            name: 'Sunil Kumar',
            phone: '+91 91234-56789',
            vehicleNumber: 'KA-03-ER-4891 (TVS Ntorq)',
            status: 'ASSIGNED',
            estimatedMinutes: 12
          },
          aggregatorCommission: {
            rate: 20,
            commissionAmount: zComm,
            netPayout: zTotal - zComm
          }
        });

        // Sample Swiggy order
        const sItem = menuItems[menuItems.length - 1];
        const sSub = (sItem.price || 240) * 2;
        const sTax = Math.round(sSub * 0.05 * 100) / 100;
        const sTotal = Math.round(sSub + sTax);
        const sComm = Math.round(sTotal * 0.22 * 100) / 100;

        await RestaurantOrder.create({
          organizationId,
          orderNumber: `ORD-DEL-${Date.now().toString().slice(-5)}2`,
          orderType: 'DELIVERY',
          aggregator: 'SWIGGY',
          aggregatorOrderId: `SWIG-${Math.floor(10000 + Math.random() * 90000)}`,
          customerName: 'Rohan Deshmukh',
          customerPhone: '+91 99450-XXXXX (Masked)',
          deliveryAddress: 'Villa 18, Palm Meadows, Outer Ring Rd (4.5 km)',
          cookingInstructions: 'Do not ring door bell, baby is sleeping. Leave at security desk.',
          items: [
            {
              menuItemId: sItem._id,
              name: sItem.name,
              price: sItem.price,
              quantity: 2,
              station: sItem.category || 'Kitchen',
              veg: Boolean(sItem.isVeg),
              status: 'READY',
              ready: true,
              readyAt: new Date()
            }
          ],
          subTotal: sSub,
          taxTotal: sTax,
          totalAmount: sTotal,
          status: 'READY',
          riderDetails: {
            name: 'Manish Verma',
            phone: '+91 98888-12345',
            vehicleNumber: 'KA-04-MB-7710 (Honda Activa)',
            status: 'ARRIVED_AT_STORE',
            estimatedMinutes: 0
          },
          aggregatorCommission: {
            rate: 22,
            commissionAmount: sComm,
            netPayout: sTotal - sComm
          }
        });

        activeQueue = await RestaurantOrder.find({
          organizationId,
          orderType: 'DELIVERY',
          status: { $in: ['CONFIRMED', 'PREPARING', 'READY'] }
        }).sort({ createdAt: -1 });
      }
    }

    // Today's delivery orders for stats
    const todayDeliveryOrders = await RestaurantOrder.find({
      organizationId,
      orderType: 'DELIVERY',
      createdAt: { $gte: startOfToday },
      status: { $ne: 'CANCELLED' }
    });

    let totalGmv = 0;
    let totalCommission = 0;
    let totalNetPayout = 0;

    const platformBreakdown = {
      ZOMATO: { orders: 0, gmv: 0, commission: 0, net: 0 },
      SWIGGY: { orders: 0, gmv: 0, commission: 0, net: 0 },
      DIRECT_WEB: { orders: 0, gmv: 0, commission: 0, net: 0 }
    };

    todayDeliveryOrders.forEach(o => {
      const gmv = Number(o.totalAmount) || 0;
      const comm = Number(o.aggregatorCommission?.commissionAmount) || 0;
      const net = Number(o.aggregatorCommission?.netPayout) || (gmv - comm);

      totalGmv += gmv;
      totalCommission += comm;
      totalNetPayout += net;

      const agg = o.aggregator || 'DIRECT_WEB';
      if (platformBreakdown[agg]) {
        platformBreakdown[agg].orders += 1;
        platformBreakdown[agg].gmv += gmv;
        platformBreakdown[agg].commission += comm;
        platformBreakdown[agg].net += net;
      }
    });

    // Recent 10 completed deliveries
    const recentDeliveries = await RestaurantOrder.find({
      organizationId,
      orderType: 'DELIVERY',
      status: { $in: ['COMPLETED', 'SERVED'] }
    }).sort({ updatedAt: -1 }).limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        config,
        stats: {
          todayOrdersCount: todayDeliveryOrders.length,
          activeQueueCount: activeQueue.length,
          grossGmvToday: Math.round(totalGmv * 100) / 100,
          totalCommissionToday: Math.round(totalCommission * 100) / 100,
          netPayoutToday: Math.round(totalNetPayout * 100) / 100,
          effectiveTakeRate: totalGmv > 0 ? Math.round((totalCommission / totalGmv) * 1000) / 10 : 0
        },
        platformBreakdown,
        activeQueue,
        recentDeliveries
      }
    });
  } catch (error) {
    next(error);
  }
};

export const simulateAggregatorOrder = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const config = await getOrCreateAggregatorConfig(organizationId);

    const {
      aggregator = 'ZOMATO',
      customerName = 'Priya Nair',
      customerPhone = '+91 98450-XXXXX (Masked)',
      deliveryAddress = 'Flat 204, Alpine Eco Apts, Marathahalli (2.8 km)',
      cookingInstructions = 'Less spicy, please send extra packaging seal tape.',
      items = [],
      riderName = 'Karthik Raja',
      riderPhone = '+91 97420-11223',
      riderVehicle = 'KA-01-EA-3344 (Ather 450X)',
      estimatedMinutes = 15
    } = req.body;

    let orderItems = items;
    // If no items provided in simulator, pick 2 available menu items automatically
    if (!orderItems || orderItems.length === 0) {
      const menu = await RestaurantMenuItem.find({ organizationId, isAvailable: true }).limit(3);
      if (menu.length === 0) {
        return next(new AppError('No available menu items found to build delivery order', 400));
      }
      orderItems = menu.slice(0, 2).map(m => ({
        menuItemId: m._id,
        name: m.name,
        price: m.price || 280,
        quantity: 1,
        station: m.category || 'Kitchen',
        veg: Boolean(m.isVeg)
      }));
    }

    let subTotal = 0;
    const formattedItems = orderItems.map(it => {
      const q = Math.max(1, Number(it.quantity) || 1);
      const p = Number(it.price) || 0;
      subTotal += (p * q);
      return {
        menuItemId: it.menuItemId,
        name: it.name,
        price: p,
        quantity: q,
        station: it.station || 'Kitchen',
        veg: Boolean(it.veg),
        status: 'QUEUED'
      };
    });

    const taxTotal = Math.round(subTotal * 0.05 * 100) / 100;
    const grandTotal = Math.round(subTotal + taxTotal);

    // Commission based on platform config
    const platformKey = aggregator === 'ZOMATO' ? 'zomato' : aggregator === 'SWIGGY' ? 'swiggy' : 'directWeb';
    const rate = config[platformKey]?.commissionRate ?? (aggregator === 'ZOMATO' ? 20 : aggregator === 'SWIGGY' ? 22 : 0);
    const commissionAmount = Math.round(grandTotal * (rate / 100) * 100) / 100;
    const netPayout = Math.round((grandTotal - commissionAmount) * 100) / 100;

    const prefix = aggregator === 'ZOMATO' ? 'ZOM' : aggregator === 'SWIGGY' ? 'SWIG' : 'WEB';
    const aggregatorOrderId = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;

    const order = await RestaurantOrder.create({
      organizationId,
      orderNumber: `ORD-DEL-${Date.now().toString().slice(-6)}`,
      orderType: 'DELIVERY',
      aggregator,
      aggregatorOrderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      cookingInstructions: cookingInstructions.trim(),
      items: formattedItems,
      subTotal,
      taxTotal,
      totalAmount: grandTotal,
      status: 'CONFIRMED',
      riderDetails: {
        name: riderName.trim(),
        phone: riderPhone.trim(),
        vehicleNumber: riderVehicle.trim(),
        status: 'ASSIGNED',
        estimatedMinutes: Math.max(5, Number(estimatedMinutes) || 15)
      },
      aggregatorCommission: {
        rate,
        commissionAmount,
        netPayout
      },
      confirmedAt: new Date(),
      createdBy: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

export const updateRiderStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await RestaurantOrder.findOne({ _id: orderId, organizationId });
    if (!order) {
      return next(new AppError('Delivery order not found', 404));
    }

    if (!order.riderDetails) {
      order.riderDetails = {};
    }

    order.riderDetails.status = status;

    if (status === 'ARRIVED_AT_STORE') {
      order.riderDetails.estimatedMinutes = 0;
    } else if (status === 'DELIVERED') {
      order.status = 'COMPLETED';
      order.completedAt = new Date();
    }

    await order.save();

    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAggregatorStoreStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { platform } = req.body; // 'zomato', 'swiggy', 'directWeb', 'surgeRainMode'
    const config = await getOrCreateAggregatorConfig(organizationId);

    if (platform === 'surgeRainMode') {
      config.surgeRainMode = !config.surgeRainMode;
    } else if (config[platform]) {
      config[platform].status = config[platform].status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    } else {
      return next(new AppError('Invalid platform key', 400));
    }

    await config.save();

    res.status(200).json({
      status: 'success',
      data: { config }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAggregatorConfig = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const config = await getOrCreateAggregatorConfig(organizationId);
    const { zomato, swiggy, directWeb, defaultPrepTimeMinutes } = req.body;

    if (zomato) config.zomato = { ...config.zomato, ...zomato };
    if (swiggy) config.swiggy = { ...config.swiggy, ...swiggy };
    if (directWeb) config.directWeb = { ...config.directWeb, ...directWeb };
    if (defaultPrepTimeMinutes !== undefined) {
      config.defaultPrepTimeMinutes = Math.max(5, Number(defaultPrepTimeMinutes));
    }

    await config.save();

    res.status(200).json({
      status: 'success',
      data: { config }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 12. TABLE RESERVATIONS & GUEST BOOKINGS
// ==========================================

const seedReservationsIfEmpty = async (organizationId) => {
  const count = await RestaurantReservation.countDocuments({ organizationId });
  if (count > 0) return;

  const tables = await RestaurantTable.find({ organizationId, isActive: true }).sort({ tableNumber: 1 }).limit(8);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const sampleBookings = [
    {
      reservationCode: 'RES-1011',
      customerName: 'Aditi Sharma',
      customerPhone: '9876543210',
      customerEmail: 'aditi.sharma@example.com',
      partySize: 4,
      reservationDate: new Date(`${todayStr}T19:30:00.000Z`),
      timeSlot: '19:30',
      durationMinutes: 90,
      tableId: tables[0]?._id,
      status: 'CONFIRMED',
      specialOccasion: 'BIRTHDAY',
      dietaryPreferences: ['VEG', 'GLUTEN_FREE'],
      depositAmount: 500,
      depositStatus: 'PAID',
      depositPaymentMethod: 'UPI',
      guestNotes: 'Celebrating 30th birthday, window booth requested with candle setting.',
      confirmationSent: true,
      confirmationMethod: 'WHATSAPP',
      confirmationSentAt: new Date(Date.now() - 3600000)
    },
    {
      reservationCode: 'RES-1012',
      customerName: 'Rajesh Verma',
      customerPhone: '9811223344',
      customerEmail: 'rajesh.v@corp.in',
      partySize: 6,
      reservationDate: new Date(`${todayStr}T20:00:00.000Z`),
      timeSlot: '20:00',
      durationMinutes: 120,
      tableId: tables[1]?._id,
      status: 'CONFIRMED',
      specialOccasion: 'BUSINESS_DINNER',
      dietaryPreferences: ['NON_VEG'],
      depositAmount: 1000,
      depositStatus: 'PAID',
      depositPaymentMethod: 'CARD',
      guestNotes: 'Quiet corner table needed for corporate client meeting.',
      confirmationSent: true,
      confirmationMethod: 'SMS',
      confirmationSentAt: new Date(Date.now() - 7200000)
    },
    {
      reservationCode: 'RES-1013',
      customerName: 'Priya & Vikram Malhotra',
      customerPhone: '9822334455',
      customerEmail: 'priya.m@gmail.com',
      partySize: 2,
      reservationDate: new Date(`${todayStr}T20:30:00.000Z`),
      timeSlot: '20:30',
      durationMinutes: 90,
      tableId: tables[2]?._id,
      status: 'CONFIRMED',
      specialOccasion: 'ANNIVERSARY',
      dietaryPreferences: ['VEGAN'],
      depositAmount: 500,
      depositStatus: 'PAID',
      depositPaymentMethod: 'UPI',
      guestNotes: 'Romantic anniversary dinner with complimentary dessert surprise.',
      confirmationSent: true,
      confirmationMethod: 'WHATSAPP',
      confirmationSentAt: new Date(Date.now() - 1800000)
    },
    {
      reservationCode: 'RES-1014',
      customerName: 'Kunal Singhal',
      customerPhone: '9833445566',
      customerEmail: 'kunal.s@tech.io',
      partySize: 3,
      reservationDate: new Date(`${todayStr}T13:30:00.000Z`),
      timeSlot: '13:30',
      durationMinutes: 60,
      tableId: tables[3]?._id,
      status: 'SEATED',
      specialOccasion: 'NONE',
      dietaryPreferences: ['LESS_OIL'],
      depositAmount: 0,
      depositStatus: 'NOT_REQUIRED',
      guestNotes: 'Quick lunch meeting.',
      seatedAt: new Date(Date.now() - 25 * 60000),
      confirmationSent: true,
      confirmationMethod: 'WHATSAPP'
    },
    {
      reservationCode: 'RES-1015',
      customerName: 'Dr. Sameer Patel',
      customerPhone: '9844556677',
      partySize: 5,
      reservationDate: new Date(`${todayStr}T12:30:00.000Z`),
      timeSlot: '12:30',
      durationMinutes: 90,
      tableId: tables[4]?._id,
      status: 'COMPLETED',
      specialOccasion: 'FAMILY_GATHERING',
      dietaryPreferences: ['JAIN'],
      depositAmount: 0,
      depositStatus: 'NOT_REQUIRED',
      completedAt: new Date(Date.now() - 60 * 60000),
      confirmationSent: true,
      confirmationMethod: 'SMS'
    }
  ];

  await RestaurantReservation.insertMany(
    sampleBookings.map(b => ({ ...b, organizationId }))
  );
};

export const getReservationsAnalytics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    await seedReservationsIfEmpty(organizationId);

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await RestaurantReservation.find({
      organizationId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('tableId', 'tableNumber capacity status');

    const totalBookings = reservations.length;
    const confirmedCount = reservations.filter(r => r.status === 'CONFIRMED').length;
    const seatedCount = reservations.filter(r => r.status === 'SEATED').length;
    const completedCount = reservations.filter(r => r.status === 'COMPLETED').length;
    const cancelledCount = reservations.filter(r => r.status === 'CANCELLED').length;
    const noShowCount = reservations.filter(r => r.status === 'NO_SHOW').length;

    // Expected covers (active bookings)
    const expectedCovers = reservations
      .filter(r => ['CONFIRMED', 'SEATED'].includes(r.status))
      .reduce((sum, r) => sum + (r.partySize || 0), 0);

    const totalCoversAll = reservations
      .filter(r => r.status !== 'CANCELLED')
      .reduce((sum, r) => sum + (r.partySize || 0), 0);

    // Deposits collected
    const depositsCollected = reservations
      .filter(r => r.depositStatus === 'PAID')
      .reduce((sum, r) => sum + (r.depositAmount || 0), 0);

    // Total active tables in restaurant
    const totalTablesCount = await RestaurantTable.countDocuments({ organizationId, isActive: true });
    const reservedTablesCount = new Set(
      reservations.filter(r => ['CONFIRMED', 'SEATED'].includes(r.status) && r.tableId).map(r => r.tableId._id?.toString() || r.tableId?.toString())
    ).size;

    // Time slot distribution
    const slotMap = {};
    reservations.forEach(r => {
      if (r.status !== 'CANCELLED') {
        const slot = r.timeSlot || '19:00';
        if (!slotMap[slot]) slotMap[slot] = { slot, bookings: 0, covers: 0 };
        slotMap[slot].bookings += 1;
        slotMap[slot].covers += (r.partySize || 0);
      }
    });
    const slotBreakdown = Object.values(slotMap).sort((a, b) => a.slot.localeCompare(b.slot));

    // Occasion breakdown
    const occasionMap = {};
    reservations.forEach(r => {
      const occ = r.specialOccasion || 'NONE';
      occasionMap[occ] = (occasionMap[occ] || 0) + 1;
    });
    const occasionBreakdown = Object.entries(occasionMap).map(([occasion, count]) => ({
      occasion,
      count
    }));

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalBookings,
          confirmedCount,
          seatedCount,
          completedCount,
          cancelledCount,
          noShowCount,
          expectedCovers,
          totalCoversAll,
          depositsCollected,
          totalTablesCount,
          reservedTablesCount,
          tableOccupancyRate: totalTablesCount > 0 ? Math.round((reservedTablesCount / totalTablesCount) * 100) : 0
        },
        slotBreakdown,
        occasionBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReservations = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    await seedReservationsIfEmpty(organizationId);

    const { date, status, search, tableId } = req.query;
    const filter = { organizationId };

    if (date && date !== 'ALL') {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.reservationDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (tableId) {
      filter.tableId = tableId;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { reservationCode: searchRegex }
      ];
    }

    const reservations = await RestaurantReservation.find(filter)
      .populate({
        path: 'tableId',
        select: 'tableNumber capacity status areaId',
        populate: { path: 'areaId', select: 'name' }
      })
      .populate('customerId', 'name phone vipTier loyaltyPoints')
      .populate('createdOrderId', 'orderNumber orderType grandTotal status')
      .sort({ reservationDate: 1, timeSlot: 1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: reservations.length,
      data: { reservations }
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableTablesForReservation = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { date, timeSlot, durationMinutes = 90, partySize = 2 } = req.query;

    const partyNum = Number(partySize) || 2;
    const durationNum = Number(durationMinutes) || 90;

    const tables = await RestaurantTable.find({ organizationId, isActive: true })
      .populate('areaId', 'name')
      .sort({ capacity: 1, tableNumber: 1 });

    let conflictingTableIds = new Set();

    if (date && timeSlot) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const toMins = (slot) => {
        if (!slot) return 0;
        const [h, m] = slot.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      const reqStart = toMins(timeSlot);
      const reqEnd = reqStart + durationNum;

      const activeReservations = await RestaurantReservation.find({
        organizationId,
        reservationDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['CONFIRMED', 'SEATED'] },
        tableId: { $ne: null }
      });

      activeReservations.forEach(resItem => {
        const resStart = toMins(resItem.timeSlot);
        const resEnd = resStart + (resItem.durationMinutes || 90);
        // Overlap condition
        if (reqStart < resEnd && reqEnd > resStart) {
          conflictingTableIds.add(resItem.tableId.toString());
        }
      });
    }

    const evaluatedTables = tables.map(tbl => {
      const isConflicted = conflictingTableIds.has(tbl._id.toString());
      const fitsParty = tbl.capacity >= partyNum;
      const capacityDiff = tbl.capacity - partyNum;

      return {
        _id: tbl._id,
        tableNumber: tbl.tableNumber,
        capacity: tbl.capacity,
        currentStatus: tbl.status,
        areaName: tbl.areaId?.name || 'Main Hall',
        isAvailable: !isConflicted,
        fitsParty,
        capacityDiff
      };
    });

    // Best recommendation: available & fitsParty with smallest positive capacityDiff
    const candidates = evaluatedTables.filter(t => t.isAvailable && t.fitsParty)
      .sort((a, b) => a.capacityDiff - b.capacityDiff);
    const recommendedTableId = candidates.length > 0 ? candidates[0]._id : null;

    res.status(200).json({
      status: 'success',
      data: {
        tables: evaluatedTables,
        recommendedTableId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const reservation = await RestaurantReservation.findOne({
      _id: req.params.id,
      organizationId
    })
      .populate({
        path: 'tableId',
        select: 'tableNumber capacity status areaId',
        populate: { path: 'areaId', select: 'name' }
      })
      .populate('customerId')
      .populate('createdOrderId');

    if (!reservation) {
      return next(new AppError('Reservation not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { reservation }
    });
  } catch (error) {
    next(error);
  }
};

export const createReservation = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate,
      timeSlot,
      durationMinutes = 90,
      tableId,
      specialOccasion = 'NONE',
      dietaryPreferences = [],
      depositAmount = 0,
      depositStatus = 'NOT_REQUIRED',
      depositPaymentMethod = 'NONE',
      guestNotes,
      internalNotes
    } = req.body;

    if (!customerName || !customerPhone || !partySize || !reservationDate || !timeSlot) {
      return next(new AppError('Customer name, phone, party size, reservation date, and time slot are required', 400));
    }

    // Auto-generate unique reservationCode
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const reservationCode = `RES-${randCode}`;

    // Link or auto-create RestaurantCustomer
    let customer = await RestaurantCustomer.findOne({ organizationId, phone: customerPhone.trim() });
    if (!customer) {
      customer = await RestaurantCustomer.create({
        organizationId,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail ? customerEmail.trim() : undefined,
        notes: `Created via reservation ${reservationCode}`
      });
    }

    // Verify table conflict if tableId assigned
    if (tableId) {
      const targetDate = new Date(reservationDate);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const toMins = (slot) => {
        if (!slot) return 0;
        const [h, m] = slot.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      const reqStart = toMins(timeSlot);
      const reqEnd = reqStart + Number(durationMinutes || 90);

      const conflicts = await RestaurantReservation.find({
        organizationId,
        tableId,
        reservationDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['CONFIRMED', 'SEATED'] }
      });

      for (const c of conflicts) {
        const cStart = toMins(c.timeSlot);
        const cEnd = cStart + (c.durationMinutes || 90);
        if (reqStart < cEnd && reqEnd > cStart) {
          return next(new AppError(`Selected table is already booked by ${c.customerName} at ${c.timeSlot}`, 400));
        }
      }
    }

    const reservation = await RestaurantReservation.create({
      organizationId,
      reservationCode,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      customerId: customer?._id,
      partySize: Number(partySize),
      reservationDate: new Date(reservationDate),
      timeSlot: timeSlot.trim(),
      durationMinutes: Number(durationMinutes) || 90,
      tableId: tableId || undefined,
      status: 'CONFIRMED',
      specialOccasion,
      dietaryPreferences,
      depositAmount: Number(depositAmount) || 0,
      depositStatus: Number(depositAmount) > 0 ? (depositStatus || 'PAID') : 'NOT_REQUIRED',
      depositPaymentMethod: Number(depositAmount) > 0 ? (depositPaymentMethod || 'UPI') : 'NONE',
      guestNotes,
      internalNotes,
      createdBy: req.user._id
    });

    const populatedReservation = await RestaurantReservation.findById(reservation._id)
      .populate({
        path: 'tableId',
        select: 'tableNumber capacity status areaId',
        populate: { path: 'areaId', select: 'name' }
      })
      .populate('customerId');

    res.status(201).json({
      status: 'success',
      data: { reservation: populatedReservation }
    });
  } catch (error) {
    next(error);
  }
};

export const updateReservation = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const reservation = await RestaurantReservation.findOne({
      _id: req.params.id,
      organizationId
    });

    if (!reservation) {
      return next(new AppError('Reservation not found', 404));
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate,
      timeSlot,
      durationMinutes,
      tableId,
      status,
      specialOccasion,
      dietaryPreferences,
      depositAmount,
      depositStatus,
      depositPaymentMethod,
      guestNotes,
      internalNotes,
      cancellationReason
    } = req.body;

    if (customerName) reservation.customerName = customerName.trim();
    if (customerPhone) reservation.customerPhone = customerPhone.trim();
    if (customerEmail !== undefined) reservation.customerEmail = customerEmail ? customerEmail.trim() : '';
    if (partySize) reservation.partySize = Number(partySize);
    if (reservationDate) reservation.reservationDate = new Date(reservationDate);
    if (timeSlot) reservation.timeSlot = timeSlot.trim();
    if (durationMinutes !== undefined) reservation.durationMinutes = Number(durationMinutes);
    if (tableId !== undefined) reservation.tableId = tableId || null;
    if (specialOccasion) reservation.specialOccasion = specialOccasion;
    if (dietaryPreferences) reservation.dietaryPreferences = dietaryPreferences;
    if (depositAmount !== undefined) reservation.depositAmount = Number(depositAmount);
    if (depositStatus) reservation.depositStatus = depositStatus;
    if (depositPaymentMethod) reservation.depositPaymentMethod = depositPaymentMethod;
    if (guestNotes !== undefined) reservation.guestNotes = guestNotes;
    if (internalNotes !== undefined) reservation.internalNotes = internalNotes;

    if (status && status !== reservation.status) {
      reservation.status = status;
      if (status === 'SEATED') {
        reservation.seatedAt = new Date();
      } else if (status === 'COMPLETED') {
        reservation.completedAt = new Date();
      } else if (status === 'CANCELLED') {
        reservation.cancelledAt = new Date();
        reservation.cancellationReason = cancellationReason || 'Cancelled by staff/guest';
      }
    }

    await reservation.save();

    const populated = await RestaurantReservation.findById(reservation._id)
      .populate({
        path: 'tableId',
        select: 'tableNumber capacity status areaId',
        populate: { path: 'areaId', select: 'name' }
      })
      .populate('customerId')
      .populate('createdOrderId');

    res.status(200).json({
      status: 'success',
      data: { reservation: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const seatReservation = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const reservation = await RestaurantReservation.findOne({
      _id: req.params.id,
      organizationId
    });

    if (!reservation) {
      return next(new AppError('Reservation not found', 404));
    }

    const tableId = req.body.tableId || reservation.tableId;
    if (!tableId) {
      return next(new AppError('A table must be assigned to seat this reservation', 400));
    }

    const table = await RestaurantTable.findOne({ _id: tableId, organizationId });
    if (!table) {
      return next(new AppError('Assigned table not found', 404));
    }

    // Mark reservation as SEATED
    reservation.status = 'SEATED';
    reservation.seatedAt = new Date();
    reservation.tableId = tableId;

    // Check if table already has an active order; if not, create one!
    let activeOrder = null;
    if (table.activeOrderId) {
      activeOrder = await RestaurantOrder.findOne({ _id: table.activeOrderId, organizationId, status: { $in: ['DRAFT', 'CONFIRMED'] } });
    }

    if (!activeOrder && req.body.createOrder !== false) {
      const orderCount = await RestaurantOrder.countDocuments({ organizationId });
      const orderNumber = `ORD-${1000 + orderCount + 1}`;

      activeOrder = await RestaurantOrder.create({
        organizationId,
        orderNumber,
        tableId: table._id,
        orderType: 'DINE_IN',
        guestCount: reservation.partySize,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        status: 'CONFIRMED',
        notes: `Reservation: ${reservation.reservationCode} - ${reservation.guestNotes || ''}`,
        createdBy: req.user._id
      });

      table.activeOrderId = activeOrder._id;
      reservation.createdOrderId = activeOrder._id;
    }

    // Update table status
    table.status = 'OCCUPIED';
    table.currentGuests = reservation.partySize;
    table.lastOccupiedAt = new Date();
    await table.save();

    await reservation.save();

    const populated = await RestaurantReservation.findById(reservation._id)
      .populate({
        path: 'tableId',
        select: 'tableNumber capacity status areaId',
        populate: { path: 'areaId', select: 'name' }
      })
      .populate('customerId')
      .populate('createdOrderId');

    res.status(200).json({
      status: 'success',
      data: {
        reservation: populated,
        table,
        order: activeOrder
      }
    });
  } catch (error) {
    next(error);
  }
};

export const sendReservationConfirmation = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const reservation = await RestaurantReservation.findOne({
      _id: req.params.id,
      organizationId
    }).populate('tableId', 'tableNumber');

    if (!reservation) {
      return next(new AppError('Reservation not found', 404));
    }

    const { method = 'WHATSAPP' } = req.body;
    const org = await Organization.findById(organizationId);
    const restaurantName = org?.name || 'Apex Gourmet Bistro';

    const formattedDate = new Date(reservation.reservationDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const occasionLine = reservation.specialOccasion !== 'NONE'
      ? `\n🎉 *Special Occasion:* ${reservation.specialOccasion.replace('_', ' ')}`
      : '';
    const dietaryLine = reservation.dietaryPreferences?.length
      ? `\n🥗 *Dietary Notes:* ${reservation.dietaryPreferences.join(', ')}`
      : '';
    const tableLine = reservation.tableId?.tableNumber
      ? `\n🏷️ *Table Allocated:* ${reservation.tableId.tableNumber}`
      : '\n🏷️ *Table:* Allocated upon arrival';
    const depositLine = reservation.depositAmount > 0
      ? `\n💳 *Deposit Confirmed:* ₹${reservation.depositAmount} (${reservation.depositPaymentMethod})`
      : '';

    const messageBody = `🍽️ *Reservation Confirmed at ${restaurantName}*
----------------------------------------
Dear *${reservation.customerName}*,

We are delighted to confirm your dining reservation:
📅 *Date:* ${formattedDate}
⏰ *Time:* ${reservation.timeSlot}
👥 *Guests:* ${reservation.partySize} Pax${tableLine}
🔖 *Booking Ref:* ${reservation.reservationCode}${occasionLine}${dietaryLine}${depositLine}

📍 *Location:* ${org?.address || 'Main Dining Hall, Apex Plaza'}
📞 *Contact:* ${reservation.customerPhone}

To modify or request special arrangements, please reply directly. We look forward to hosting you!
----------------------------------------
*ApexBuild Restaurant OS*`;

    reservation.confirmationSent = true;
    reservation.confirmationSentAt = new Date();
    reservation.confirmationMethod = method;
    await reservation.save();

    res.status(200).json({
      status: 'success',
      data: {
        recipient: reservation.customerPhone,
        customerName: reservation.customerName,
        method,
        sentAt: reservation.confirmationSentAt,
        messageBody
      }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const reservation = await RestaurantReservation.findOne({
      _id: req.params.id,
      organizationId
    });

    if (!reservation) {
      return next(new AppError('Reservation not found', 404));
    }

    reservation.status = 'CANCELLED';
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = req.body.reason || 'Cancelled by guest or front desk';

    // If table was marked RESERVED, free it back to AVAILABLE
    if (reservation.tableId) {
      const table = await RestaurantTable.findOne({ _id: reservation.tableId, organizationId });
      if (table && table.status === 'RESERVED') {
        table.status = 'AVAILABLE';
        await table.save();
      }
    }

    await reservation.save();

    res.status(200).json({
      status: 'success',
      message: 'Reservation cancelled successfully',
      data: { reservation }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 13. STAFF ATTENDANCE, ROSTERING & TIPS POOL
// ==========================================

const seedStaffIfEmpty = async (organizationId) => {
  const staffCount = await RestaurantStaff.countDocuments({ organizationId });
  if (staffCount > 0) return;

  const sampleStaff = [
    {
      employeeCode: 'EMP-101',
      name: 'Vikramaditya Roy',
      phone: '9811001122',
      email: 'vikram.roy@apexkitchen.in',
      role: 'HEAD_CHEF',
      department: 'KITCHEN_BOH',
      hourlyWage: 250,
      monthlySalary: 48000,
      tipShareWeight: 1.2,
      status: 'ACTIVE',
      emergencyContact: { name: 'Maitreyi Roy', phone: '9811001199', relation: 'Spouse' },
      bankDetails: { accountName: 'Vikramaditya Roy', accountNumber: '918020012345678', ifscCode: 'HDFC0001234', upiId: 'vikramroy@oksbi' },
      notes: 'Master culinary lead, handles hot kitchen line and signature recipes.'
    },
    {
      employeeCode: 'EMP-102',
      name: 'Sunita Deshmukh',
      phone: '9811002233',
      email: 'sunita.d@apexkitchen.in',
      role: 'SOUS_CHEF',
      department: 'KITCHEN_BOH',
      hourlyWage: 180,
      monthlySalary: 34000,
      tipShareWeight: 1.1,
      status: 'ACTIVE',
      bankDetails: { accountName: 'Sunita Deshmukh', accountNumber: '918020023456789', ifscCode: 'ICIC0002345', upiId: 'sunita.d@okaxis' },
      notes: 'Oversees kitchen prep lists and gravy/curry consistency.'
    },
    {
      employeeCode: 'EMP-103',
      name: 'Rahul Nair',
      phone: '9811003344',
      email: 'rahul.nair@apexkitchen.in',
      role: 'HEAD_STEWARD',
      department: 'SERVICE_FOH',
      hourlyWage: 160,
      monthlySalary: 30000,
      tipShareWeight: 1.3,
      status: 'ACTIVE',
      bankDetails: { accountName: 'Rahul Nair', accountNumber: '918020034567890', ifscCode: 'SBIN0003456', upiId: 'rahul.nair@paytm' },
      notes: 'Head of dining room service, floor assignments, and VIP guest relations.'
    },
    {
      employeeCode: 'EMP-104',
      name: 'Ananya Sen',
      phone: '9811004455',
      email: 'ananya.s@apexkitchen.in',
      role: 'STEWARD',
      department: 'SERVICE_FOH',
      hourlyWage: 120,
      monthlySalary: 22000,
      tipShareWeight: 1.0,
      status: 'ACTIVE',
      bankDetails: { accountName: 'Ananya Sen', accountNumber: '918020045678901', ifscCode: 'UTIB0004567', upiId: 'ananya.sen@okicici' },
      notes: 'Section A tables specialist with top customer feedback.'
    },
    {
      employeeCode: 'EMP-105',
      name: 'Deepa Karmakar',
      phone: '9811005566',
      email: 'deepa.k@apexkitchen.in',
      role: 'STEWARD',
      department: 'SERVICE_FOH',
      hourlyWage: 120,
      monthlySalary: 22000,
      tipShareWeight: 1.0,
      status: 'ACTIVE',
      bankDetails: { accountName: 'Deepa Karmakar', accountNumber: '918020056789012', ifscCode: 'HDFC0005678', upiId: 'deepa.k@oksbi' },
      notes: 'Section B outdoor patio steward.'
    },
    {
      employeeCode: 'EMP-106',
      name: 'Amitav Ghosh',
      phone: '9811006677',
      email: 'amitav.barista@apexkitchen.in',
      role: 'BARISTA',
      department: 'BAR_BEVERAGE',
      hourlyWage: 140,
      monthlySalary: 26000,
      tipShareWeight: 1.1,
      status: 'ACTIVE',
      bankDetails: { accountName: 'Amitav Ghosh', accountNumber: '918020067890123', ifscCode: 'PUNB0006789', upiId: 'amitav.ghosh@ybl' },
      notes: 'Expert in craft mocktails, artisanal coffee, and beverage bar inventory.'
    },
    {
      employeeCode: 'EMP-107',
      name: 'Ramesh Yadav',
      phone: '9811007788',
      email: 'ramesh.y@apexkitchen.in',
      role: 'BUSSER',
      department: 'SERVICE_FOH',
      hourlyWage: 100,
      monthlySalary: 17000,
      tipShareWeight: 0.8,
      status: 'ACTIVE',
      notes: 'Table clearing, water service, and cutlery restocking.'
    }
  ];

  const createdStaff = await RestaurantStaff.insertMany(
    sampleStaff.map(s => ({ ...s, organizationId }))
  );

  // Seed Today's scheduled shifts & attendance
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

  const sampleRosters = [
    {
      staffId: createdStaff[0]._id, // Chef Vikram
      date: todayDate,
      shiftType: 'LUNCH_PEAK',
      scheduledStartTime: '11:00',
      scheduledEndTime: '17:00',
      station: 'Main Kitchen Pass',
      status: 'CLOCKED_IN',
      clockInTime: new Date(`${todayStr}T10:50:00.000Z`)
    },
    {
      staffId: createdStaff[1]._id, // Sous Chef Sunita
      date: todayDate,
      shiftType: 'LUNCH_PEAK',
      scheduledStartTime: '11:00',
      scheduledEndTime: '17:00',
      station: 'Curry & Gravy Station',
      status: 'CLOCKED_IN',
      clockInTime: new Date(`${todayStr}T11:02:00.000Z`)
    },
    {
      staffId: createdStaff[2]._id, // Rahul Head Steward
      date: todayDate,
      shiftType: 'LUNCH_PEAK',
      scheduledStartTime: '11:30',
      scheduledEndTime: '17:30',
      station: 'Main Dining Floor',
      status: 'CLOCKED_IN',
      clockInTime: new Date(`${todayStr}T11:25:00.000Z`)
    },
    {
      staffId: createdStaff[3]._id, // Ananya
      date: todayDate,
      shiftType: 'LUNCH_PEAK',
      scheduledStartTime: '12:00',
      scheduledEndTime: '17:00',
      station: 'Section A - Tables 1-6',
      status: 'CLOCKED_IN',
      clockInTime: new Date(`${todayStr}T11:55:00.000Z`)
    },
    {
      staffId: createdStaff[4]._id, // Deepa
      date: todayDate,
      shiftType: 'EVENING_DINNER',
      scheduledStartTime: '17:30',
      scheduledEndTime: '23:30',
      station: 'Section B - Patio & Rooftop',
      status: 'SCHEDULED'
    },
    {
      staffId: createdStaff[5]._id, // Amitav Barista
      date: todayDate,
      shiftType: 'DOUBLE_SHIFT',
      scheduledStartTime: '12:00',
      scheduledEndTime: '22:00',
      station: 'Coffee Bar & Mocktails Counter',
      status: 'CLOCKED_IN',
      clockInTime: new Date(`${todayStr}T11:45:00.000Z`)
    },
    {
      staffId: createdStaff[6]._id, // Ramesh Busser
      date: todayDate,
      shiftType: 'LUNCH_PEAK',
      scheduledStartTime: '11:30',
      scheduledEndTime: '16:30',
      station: 'Dining Hall Bussing Station',
      status: 'CLOCKED_IN',
      clockInTime: new Date(`${todayStr}T11:28:00.000Z`)
    }
  ];

  await RestaurantRosterShift.insertMany(
    sampleRosters.map(r => ({ ...r, organizationId }))
  );
};

// 1. Staff Analytics
export const getStaffAnalytics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    await seedStaffIfEmpty(organizationId);

    const staffMembers = await RestaurantStaff.find({ organizationId, isActive: true });
    const totalStaff = staffMembers.length;
    const activeStaff = staffMembers.filter(s => s.status === 'ACTIVE').length;
    const onLeaveStaff = staffMembers.filter(s => s.status === 'ON_LEAVE').length;

    // Monthly payroll liability
    const monthlyPayroll = staffMembers.reduce((sum, s) => sum + (s.monthlySalary || 0), 0);

    // Department breakdown
    const departmentCounts = {
      KITCHEN_BOH: staffMembers.filter(s => s.department === 'KITCHEN_BOH').length,
      SERVICE_FOH: staffMembers.filter(s => s.department === 'SERVICE_FOH').length,
      BAR_BEVERAGE: staffMembers.filter(s => s.department === 'BAR_BEVERAGE').length,
      MANAGEMENT: staffMembers.filter(s => s.department === 'MANAGEMENT').length,
      HOUSEKEEPING: staffMembers.filter(s => s.department === 'HOUSEKEEPING').length,
    };

    // Today's on-duty clocked in
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayShifts = await RestaurantRosterShift.find({
      organizationId,
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    const scheduledToday = todayShifts.length;
    const clockedInToday = todayShifts.filter(s => s.status === 'CLOCKED_IN').length;
    const clockedOutToday = todayShifts.filter(s => s.status === 'CLOCKED_OUT').length;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalStaff,
          activeStaff,
          onLeaveStaff,
          scheduledToday,
          clockedInToday,
          clockedOutToday,
          monthlyPayroll
        },
        departmentCounts
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Staff Directory CRUD
export const getStaffMembers = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    await seedStaffIfEmpty(organizationId);

    const { department, role, status, search } = req.query;
    const filter = { organizationId, isActive: true };

    if (department && department !== 'ALL') filter.department = department;
    if (role && role !== 'ALL') filter.role = role;
    if (status && status !== 'ALL') filter.status = status;

    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: reg },
        { phone: reg },
        { employeeCode: reg }
      ];
    }

    const staff = await RestaurantStaff.find(filter)
      .sort({ department: 1, role: 1, name: 1 });

    res.status(200).json({
      status: 'success',
      results: staff.length,
      data: { staff }
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const staff = await RestaurantStaff.findOne({ _id: req.params.id, organizationId });
    if (!staff) return next(new AppError('Staff member not found', 404));

    res.status(200).json({
      status: 'success',
      data: { staff }
    });
  } catch (error) {
    next(error);
  }
};

export const createStaffMember = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      employeeCode,
      name,
      phone,
      email,
      role,
      department,
      hourlyWage,
      monthlySalary,
      tipShareWeight,
      status,
      emergencyContact,
      bankDetails,
      notes
    } = req.body;

    if (!name || !phone) {
      return next(new AppError('Name and phone number are required', 400));
    }

    // Auto-generate employeeCode if not provided
    let finalCode = employeeCode?.trim();
    if (!finalCode) {
      const count = await RestaurantStaff.countDocuments({ organizationId });
      finalCode = `EMP-${100 + count + 1}`;
    }

    const newStaff = await RestaurantStaff.create({
      organizationId,
      employeeCode: finalCode,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      role: role || 'STEWARD',
      department: department || 'SERVICE_FOH',
      hourlyWage: Number(hourlyWage) || 0,
      monthlySalary: Number(monthlySalary) || 0,
      tipShareWeight: Number(tipShareWeight) >= 0 ? Number(tipShareWeight) : 1.0,
      status: status || 'ACTIVE',
      emergencyContact,
      bankDetails,
      notes
    });

    res.status(201).json({
      status: 'success',
      data: { staff: newStaff }
    });
  } catch (error) {
    next(error);
  }
};

export const updateStaffMember = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const staff = await RestaurantStaff.findOne({ _id: req.params.id, organizationId });
    if (!staff) return next(new AppError('Staff member not found', 404));

    const fields = [
      'name', 'phone', 'email', 'role', 'department', 
      'hourlyWage', 'monthlySalary', 'tipShareWeight', 'status',
      'emergencyContact', 'bankDetails', 'notes'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (['hourlyWage', 'monthlySalary', 'tipShareWeight'].includes(field)) {
          staff[field] = Number(req.body[field]);
        } else {
          staff[field] = req.body[field];
        }
      }
    });

    await staff.save();

    res.status(200).json({
      status: 'success',
      data: { staff }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStaffMember = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const staff = await RestaurantStaff.findOne({ _id: req.params.id, organizationId });
    if (!staff) return next(new AppError('Staff member not found', 404));

    staff.isActive = false;
    staff.status = 'INACTIVE';
    await staff.save();

    res.status(200).json({
      status: 'success',
      message: 'Staff member deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 3. Shift Rostering & Attendance
export const getRosterSchedule = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    await seedStaffIfEmpty(organizationId);

    const { date, shiftType } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filter = {
      organizationId,
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    if (shiftType && shiftType !== 'ALL') {
      filter.shiftType = shiftType;
    }

    const roster = await RestaurantRosterShift.find(filter)
      .populate('staffId', 'name phone role department employeeCode tipShareWeight status')
      .sort({ scheduledStartTime: 1 });

    res.status(200).json({
      status: 'success',
      results: roster.length,
      data: { roster }
    });
  } catch (error) {
    next(error);
  }
};

export const createRosterShift = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      staffId,
      date,
      shiftType,
      scheduledStartTime,
      scheduledEndTime,
      station,
      notes
    } = req.body;

    if (!staffId || !date || !scheduledStartTime || !scheduledEndTime) {
      return next(new AppError('Staff member, date, and start/end times are required', 400));
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const shift = await RestaurantRosterShift.create({
      organizationId,
      staffId,
      date: targetDate,
      shiftType: shiftType || 'LUNCH_PEAK',
      scheduledStartTime: scheduledStartTime.trim(),
      scheduledEndTime: scheduledEndTime.trim(),
      station: station || 'Floor Section',
      notes,
      createdBy: req.user._id
    });

    const populated = await RestaurantRosterShift.findById(shift._id)
      .populate('staffId', 'name phone role department employeeCode');

    res.status(201).json({
      status: 'success',
      data: { shift: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const updateRosterShift = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const shift = await RestaurantRosterShift.findOne({ _id: req.params.id, organizationId });
    if (!shift) return next(new AppError('Roster shift not found', 404));

    const { shiftType, scheduledStartTime, scheduledEndTime, station, status, notes } = req.body;
    if (shiftType) shift.shiftType = shiftType;
    if (scheduledStartTime) shift.scheduledStartTime = scheduledStartTime;
    if (scheduledEndTime) shift.scheduledEndTime = scheduledEndTime;
    if (station !== undefined) shift.station = station;
    if (status) shift.status = status;
    if (notes !== undefined) shift.notes = notes;

    await shift.save();

    const populated = await RestaurantRosterShift.findById(shift._id)
      .populate('staffId', 'name phone role department employeeCode');

    res.status(200).json({
      status: 'success',
      data: { shift: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const clockInStaff = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const shift = await RestaurantRosterShift.findOne({ _id: req.params.id, organizationId });
    if (!shift) return next(new AppError('Roster shift not found', 404));

    shift.status = 'CLOCKED_IN';
    shift.clockInTime = new Date();
    await shift.save();

    const populated = await RestaurantRosterShift.findById(shift._id)
      .populate('staffId', 'name phone role department employeeCode');

    res.status(200).json({
      status: 'success',
      message: 'Staff clocked in successfully',
      data: { shift: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const clockOutStaff = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const shift = await RestaurantRosterShift.findOne({ _id: req.params.id, organizationId });
    if (!shift) return next(new AppError('Roster shift not found', 404));

    shift.status = 'CLOCKED_OUT';
    shift.clockOutTime = new Date();

    if (shift.clockInTime) {
      const diffMs = shift.clockOutTime - shift.clockInTime;
      const hours = Math.max(0.5, Math.round((diffMs / 3600000) * 10) / 10);
      shift.actualHoursWorked = hours;

      if (hours > 8) {
        shift.overtimeMinutes = Math.round((hours - 8) * 60);
      }
    } else {
      shift.actualHoursWorked = 6.0;
    }

    await shift.save();

    const populated = await RestaurantRosterShift.findById(shift._id)
      .populate('staffId', 'name phone role department employeeCode');

    res.status(200).json({
      status: 'success',
      message: 'Staff clocked out successfully',
      data: { shift: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRosterShift = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    await RestaurantRosterShift.findOneAndDelete({ _id: req.params.id, organizationId });

    res.status(200).json({
      status: 'success',
      message: 'Roster shift removed'
    });
  } catch (error) {
    next(error);
  }
};

// 4. Gratuity & Tips Pool Distribution
export const getTipPoolAnalytics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Sum service charge from paid bills today
    const todayBills = await RestaurantBill.find({
      organizationId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: 'PAID'
    });
    const autoServiceChargeToday = todayBills.reduce((sum, b) => sum + (b.serviceCharge || 0), 0);

    // Today's tip pools
    const todayPools = await RestaurantTipPool.find({
      organizationId,
      poolDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const todayTipsCollected = todayPools.reduce((sum, p) => sum + (p.totalTipsCollected || 0), 0) || autoServiceChargeToday;
    const todayTipsDisbursed = todayPools
      .filter(p => p.status === 'DISBURSED')
      .reduce((sum, p) => sum + (p.totalTipsCollected || 0), 0);

    // Month's total distributed tips
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthPools = await RestaurantTipPool.find({
      organizationId,
      poolDate: { $gte: startOfMonth, $lte: endOfDay },
      status: 'DISBURSED'
    });
    const monthTotalTipsDisbursed = monthPools.reduce((sum, p) => sum + (p.totalTipsCollected || 0), 0);

    const activeStaffCount = await RestaurantStaff.countDocuments({ organizationId, status: 'ACTIVE', isActive: true });

    res.status(200).json({
      status: 'success',
      data: {
        todayTipsCollected: Math.max(todayTipsCollected, autoServiceChargeToday),
        autoServiceChargeToday,
        todayTipsDisbursed,
        monthTotalTipsDisbursed,
        activeStaffCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTipPools = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { date, status } = req.query;
    const filter = { organizationId };

    if (date && date !== 'ALL') {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.poolDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const pools = await RestaurantTipPool.find(filter)
      .populate('payouts.staffId', 'name role department employeeCode phone upiId')
      .sort({ poolDate: -1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: pools.length,
      data: { pools }
    });
  } catch (error) {
    next(error);
  }
};

export const calculateTipPool = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      poolDate,
      shiftPeriod = 'FULL_DAY',
      cashTips = 0,
      digitalTips = 0,
      serviceChargeCollected = 0,
      distributionFormula = 'ROLE_WEIGHTED',
      notes
    } = req.body;

    const totalTipsCollected = (Number(cashTips) || 0) + (Number(digitalTips) || 0) + (Number(serviceChargeCollected) || 0);
    if (totalTipsCollected <= 0) {
      return next(new AppError('Total tip pool amount must be greater than zero', 400));
    }

    const targetDate = poolDate ? new Date(poolDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Eligible staff: active BOH and FOH members
    const eligibleStaff = await RestaurantStaff.find({
      organizationId,
      status: 'ACTIVE',
      isActive: true,
      department: { $in: ['SERVICE_FOH', 'KITCHEN_BOH', 'BAR_BEVERAGE'] }
    });

    if (eligibleStaff.length === 0) {
      return next(new AppError('No eligible active service or kitchen staff found for tips pool', 400));
    }

    // Lookup hours worked on that date if HOURS_WORKED_WEIGHTED
    const rosterShifts = await RestaurantRosterShift.find({
      organizationId,
      date: { $gte: targetDate, $lte: endOfDay }
    });

    const shiftMap = {};
    rosterShifts.forEach(s => {
      shiftMap[s.staffId.toString()] = s.actualHoursWorked || 6;
    });

    // Compute shares
    let totalShares = 0;
    const payouts = eligibleStaff.map(staff => {
      let weight = staff.tipShareWeight || 1.0;
      let hoursWorked = shiftMap[staff._id.toString()] || 6;
      let points = 1.0;

      if (distributionFormula === 'EQUAL_SPLIT') {
        points = 1.0;
      } else if (distributionFormula === 'ROLE_WEIGHTED') {
        points = weight;
      } else if (distributionFormula === 'HOURS_WORKED_WEIGHTED') {
        points = Math.round(weight * (hoursWorked / 6) * 100) / 100;
      }

      totalShares += points;

      return {
        staffId: staff._id,
        staffName: staff.name,
        role: staff.role,
        department: staff.department,
        hoursWorked,
        weight,
        points,
        calculatedTipAmount: 0,
        payoutStatus: 'PENDING',
        payoutMethod: 'CASH',
        upiId: staff.bankDetails?.upiId || ''
      };
    });

    const tipPerShare = totalShares > 0 ? (totalTipsCollected / totalShares) : 0;
    payouts.forEach(p => {
      p.calculatedTipAmount = Math.round(p.points * tipPerShare);
    });

    // Create or update tip pool
    const pool = await RestaurantTipPool.create({
      organizationId,
      poolDate: targetDate,
      shiftPeriod,
      totalTipsCollected,
      cashTips: Number(cashTips) || 0,
      digitalTips: Number(digitalTips) || 0,
      serviceChargeCollected: Number(serviceChargeCollected) || 0,
      distributionFormula,
      totalShares: Math.round(totalShares * 100) / 100,
      tipPerShare: Math.round(tipPerShare * 100) / 100,
      eligibleStaffCount: eligibleStaff.length,
      payouts,
      status: 'CALCULATED',
      notes
    });

    res.status(201).json({
      status: 'success',
      data: { pool }
    });
  } catch (error) {
    next(error);
  }
};

export const disburseTipPool = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const pool = await RestaurantTipPool.findOne({ _id: req.params.id, organizationId });
    if (!pool) return next(new AppError('Tip pool not found', 404));

    pool.status = 'DISBURSED';
    pool.disbursedAt = new Date();
    pool.disbursedBy = req.user._id;

    // Mark all payouts as paid
    pool.payouts.forEach(p => {
      p.payoutStatus = 'PAID';
      p.paidAt = new Date();
    });

    await pool.save();

    res.status(200).json({
      status: 'success',
      message: `Gratuity pool of ₹${pool.totalTipsCollected} successfully disbursed!`,
      data: { pool }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTipPayoutStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { id, payoutId } = req.params;
    const { payoutStatus, payoutMethod } = req.body;

    const pool = await RestaurantTipPool.findOne({ _id: id, organizationId });
    if (!pool) return next(new AppError('Tip pool not found', 404));

    const item = pool.payouts.id(payoutId);
    if (!item) return next(new AppError('Payout item not found in pool', 404));

    if (payoutStatus) {
      item.payoutStatus = payoutStatus;
      if (payoutStatus === 'PAID') item.paidAt = new Date();
    }
    if (payoutMethod) item.payoutMethod = payoutMethod;

    await pool.save();

    res.status(200).json({
      status: 'success',
      data: { pool }
    });
  } catch (error) {
    next(error);
  }
};
