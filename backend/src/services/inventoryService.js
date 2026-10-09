import MaterialLedger from '../models/MaterialLedger.js';
import Material from '../models/Material.js';
import AppError from '../utils/AppError.js';

export const receiveMaterial = async (organizationId, projectId, materialId, quantity, referenceId, userId, session) => {
  if (quantity <= 0) throw new AppError('Quantity must be positive for receipt', 400);
  
  await MaterialLedger.create([{
    organizationId,
    projectId,
    materialId,
    type: 'RECEIPT',
    quantity,
    referenceId,
    createdBy: userId
  }], { session });

  await updateCurrentStock(organizationId, materialId, session);
};

export const consumeMaterial = async (organizationId, projectId, materialId, quantity, referenceId, userId, session) => {
  if (quantity <= 0) throw new AppError('Quantity must be positive for consumption', 400);

  // Consumption removes stock, so negative quantity in ledger
  await MaterialLedger.create([{
    organizationId,
    projectId,
    materialId,
    type: 'CONSUMPTION',
    quantity: -quantity,
    referenceId,
    createdBy: userId
  }], { session });

  await updateCurrentStock(organizationId, materialId, session);
};

// Internal function to recalculate and update stock on the Material model
const updateCurrentStock = async (organizationId, materialId, session) => {
  const ledgerEntries = await MaterialLedger.find({ organizationId, materialId }).session(session);
  
  const currentStock = ledgerEntries.reduce((acc, entry) => acc + entry.quantity, 0);

  await Material.findByIdAndUpdate(
    materialId, 
    { currentStock },
    { session }
  );
};
