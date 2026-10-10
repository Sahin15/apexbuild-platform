import Equipment from '../models/Equipment.js';
import EquipmentLog from '../models/EquipmentLog.js';
import Project from '../models/Project.js';

export const getEquipments = async (req, res, next) => {
  try {
    const { projectId, status, category, ownership } = req.query;
    const filter = { organizationId: req.user.organizationId };

    if (projectId && projectId !== 'ALL') filter.projectId = projectId;
    if (status && status !== 'ALL') filter.status = status;
    if (category && category !== 'ALL') filter.category = category;
    if (ownership && ownership !== 'ALL') filter.ownership = ownership;

    const equipments = await Equipment.find(filter)
      .populate('projectId', 'name projectCode')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: { equipments }
    });
  } catch (error) {
    next(error);
  }
};

export const createEquipment = async (req, res, next) => {
  try {
    const {
      projectId,
      name,
      equipmentCode,
      category,
      ownership,
      supplierOrOwner,
      registrationNo,
      modelYear,
      operatorName,
      operatorPhone,
      rateType,
      rentalRate,
      fuelType,
      fuelTankCapacity,
      standardConsumptionPerHour,
      initialMeterReading,
      notes
    } = req.body;

    if (!name || !equipmentCode || !projectId) {
      return res.status(400).json({ status: 'fail', message: 'Machine name, asset code, and project are required' });
    }

    const meter = Number(initialMeterReading) || 0;

    const equipment = await Equipment.create({
      organizationId: req.user.organizationId,
      projectId,
      name,
      equipmentCode,
      category: category || 'EARTHMOVING',
      ownership: ownership || 'OWNED',
      supplierOrOwner: supplierOrOwner || 'Company Owned',
      registrationNo: registrationNo || '',
      modelYear: modelYear || '',
      operatorName: operatorName || '',
      operatorPhone: operatorPhone || '',
      rateType: rateType || 'HOURLY',
      rentalRate: Number(rentalRate) || 0,
      fuelType: fuelType || 'DIESEL',
      fuelTankCapacity: Number(fuelTankCapacity) || 120,
      standardConsumptionPerHour: Number(standardConsumptionPerHour) || 5,
      initialMeterReading: meter,
      currentMeterReading: meter,
      notes: notes || ''
    });

    res.status(201).json({
      status: 'success',
      data: { equipment }
    });
  } catch (error) {
    next(error);
  }
};

export const updateEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({ status: 'fail', message: 'Equipment not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { equipment }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!equipment) {
      return res.status(404).json({ status: 'fail', message: 'Equipment not found' });
    }

    // Also delete logs
    await EquipmentLog.deleteMany({ equipmentId: req.params.id });

    res.status(200).json({
      status: 'success',
      message: 'Equipment and its logs deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getEquipmentLogs = async (req, res, next) => {
  try {
    const { projectId, equipmentId, startDate, endDate } = req.query;
    const filter = { organizationId: req.user.organizationId };

    if (projectId && projectId !== 'ALL') filter.projectId = projectId;
    if (equipmentId && equipmentId !== 'ALL') filter.equipmentId = equipmentId;
    if (startDate && endDate) {
      filter.logDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const logs = await EquipmentLog.find(filter)
      .populate('equipmentId', 'name equipmentCode category ownership registrationNo rentalRate rateType')
      .populate('projectId', 'name projectCode')
      .sort('-logDate -createdAt');

    res.status(200).json({
      status: 'success',
      data: { logs }
    });
  } catch (error) {
    next(error);
  }
};

export const createEquipmentLog = async (req, res, next) => {
  try {
    const {
      projectId,
      equipmentId,
      logDate,
      slipNo,
      shift,
      startMeter,
      endMeter,
      idleHours,
      breakdownHours,
      fuelIssuedLiters,
      fuelRatePerLiter,
      fuelSource,
      fuelSlipNumber,
      operatorCost,
      workDescription,
      location,
      operatorName,
      supervisorName,
      remarks
    } = req.body;

    if (!equipmentId || !projectId) {
      return res.status(400).json({ status: 'fail', message: 'Equipment and Project are required' });
    }

    const equipment = await Equipment.findOne({
      _id: equipmentId,
      organizationId: req.user.organizationId
    });

    if (!equipment) {
      return res.status(404).json({ status: 'fail', message: 'Equipment asset not found' });
    }

    const start = Number(startMeter) || equipment.currentMeterReading || 0;
    const end = Number(endMeter) >= start ? Number(endMeter) : start;
    const opHours = Number((end - start).toFixed(2));
    
    // Calculate rental cost if machine is rented
    let rentalCost = 0;
    if (equipment.ownership === 'RENTED') {
      if (equipment.rateType === 'HOURLY') {
        rentalCost = opHours * (equipment.rentalRate || 0);
      } else if (equipment.rateType === 'DAILY') {
        rentalCost = equipment.rentalRate || 0;
      }
    }

    const fuelLtr = Number(fuelIssuedLiters) || 0;
    const fuelRate = Number(fuelRatePerLiter) || 92;
    const fuelCost = Number((fuelLtr * fuelRate).toFixed(2));
    const opCost = Number(operatorCost) || 0;
    const dayCost = Number((rentalCost + fuelCost + opCost).toFixed(2));

    const generatedSlipNo = slipNo || `LOG-${new Date().toISOString().split('T')[0]}-${Math.floor(1000 + Math.random() * 9000)}`;

    const log = await EquipmentLog.create({
      organizationId: req.user.organizationId,
      projectId,
      equipmentId,
      logDate: logDate ? new Date(logDate) : new Date(),
      slipNo: generatedSlipNo,
      shift: shift || 'DAY',
      startMeter: start,
      endMeter: end,
      operatingHours: opHours,
      idleHours: Number(idleHours) || 0,
      breakdownHours: Number(breakdownHours) || 0,
      fuelIssuedLiters: fuelLtr,
      fuelRatePerLiter: fuelRate,
      fuelTotalCost: fuelCost,
      fuelSource: fuelSource || 'SITE_TANK',
      fuelSlipNumber: fuelSlipNumber || '',
      equipmentRentalCost: rentalCost,
      operatorCost: opCost,
      totalDayCost: dayCost,
      workDescription: workDescription || '',
      location: location || 'Main Work Front',
      operatorName: operatorName || equipment.operatorName || '',
      supervisorName: supervisorName || '',
      remarks: remarks || '',
      recordedBy: req.user._id
    });

    // Update equipment current meter reading to latest
    if (end > equipment.currentMeterReading) {
      equipment.currentMeterReading = end;
      await equipment.save();
    }

    res.status(201).json({
      status: 'success',
      data: { log }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEquipmentLog = async (req, res, next) => {
  try {
    const log = await EquipmentLog.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!log) {
      return res.status(404).json({ status: 'fail', message: 'Equipment log not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Equipment log deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getEquipmentSummary = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (projectId && projectId !== 'ALL') filter.projectId = projectId;

    const equipments = await Equipment.find(filter);
    const logs = await EquipmentLog.find(filter);

    const totalMachines = equipments.length;
    const activeMachines = equipments.filter(e => e.status === 'ACTIVE').length;
    const rentedMachines = equipments.filter(e => e.ownership === 'RENTED').length;
    const ownedMachines = equipments.filter(e => e.ownership === 'OWNED').length;

    const totalHoursRun = logs.reduce((sum, l) => sum + (l.operatingHours || 0), 0);
    const totalIdleHours = logs.reduce((sum, l) => sum + (l.idleHours || 0), 0);
    const totalDieselLiters = logs.reduce((sum, l) => sum + (l.fuelIssuedLiters || 0), 0);
    const totalDieselCost = logs.reduce((sum, l) => sum + (l.fuelTotalCost || 0), 0);
    const totalRentalCost = logs.reduce((sum, l) => sum + (l.equipmentRentalCost || 0), 0);
    const totalDayCost = logs.reduce((sum, l) => sum + (l.totalDayCost || 0), 0);

    res.status(200).json({
      status: 'success',
      data: {
        totalMachines,
        activeMachines,
        rentedMachines,
        ownedMachines,
        totalHoursRun: Number(totalHoursRun.toFixed(1)),
        totalIdleHours: Number(totalIdleHours.toFixed(1)),
        totalDieselLiters: Number(totalDieselLiters.toFixed(1)),
        totalDieselCost,
        totalRentalCost,
        totalExpenditure: totalDayCost
      }
    });
  } catch (error) {
    next(error);
  }
};
