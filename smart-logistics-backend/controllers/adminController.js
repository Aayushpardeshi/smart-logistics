const adminService = require("../services/adminService");

const getStats = async (req, res) => {
  const stats = await adminService.getSystemStats();
  res.json({ success: true, data: stats });
};

const getUsers = async (req, res) => {
  const users = await adminService.getAllUsers();
  res.json({ success: true, data: users });
};

const getPendingDocuments = async (req, res) => {
  const documents = await adminService.getPendingDocuments();
  res.json({ success: true, data: documents });
};

const verifyDocument = async (req, res) => {
  const { id } = req.params; // truckId
  const { docType, action } = req.body;

  if (!docType || !action) {
    res.status(400);
    throw new Error("docType and action are required");
  }

  const result = await adminService.verifyDocument(id, docType, action);
  res.json({ success: true, data: result, message: `Document ${action}d successfully` });
};

module.exports = {
  getStats,
  getUsers,
  getPendingDocuments,
  verifyDocument
};
