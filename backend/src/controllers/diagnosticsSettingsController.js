import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';

export const getLabSettings = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const org = await Organization.findById(orgId);
    if (!org) return next(new AppError('Organization not found', 404));

    // Ensure default diagnostics settings exist
    const defaultDiagnostics = {
      nablAccreditation: {
        accredited: true,
        registrationNumber: 'NABL-MC-2026-941',
        validTill: '2028-12-31'
      },
      letterhead: {
        showHeader: true,
        showFooter: true,
        tagline: 'Precision Pathology, Radiology & Molecular Diagnostics',
        footerText: 'Tests performed on fully automated NABL-calibrated analyzers. For clinical interpretation, please correlate with clinical findings.',
        reportTitle: 'LABORATORY INVESTIGATION REPORT',
        isoAccreditationText: 'ISO 15189:2022 & NABL ACCREDITED LABORATORY'
      },
      signatures: [
        {
          id: 'sig_1',
          name: 'Dr. Anita Roy, MD',
          degree: 'MD (Pathology), DNB',
          designation: 'Chief Pathologist & Lab Director',
          active: true
        },
        {
          id: 'sig_2',
          name: 'Dr. Rajesh Sen, PhD',
          degree: 'PhD (Clinical Biochemistry)',
          designation: 'Senior Consultant Biochemist',
          active: true
        },
        {
          id: 'sig_3',
          name: 'Sourav Ghosh, MSc',
          degree: 'MSc MLT (Hematology)',
          designation: 'Technical Supervisor',
          active: true
        }
      ],
      printPreferences: {
        pageSize: 'A4',
        showQrCode: true,
        showBarcode: true,
        showBiologicalReference: true,
        showTechnicianName: true
      },
      equipmentSync: {
        enabled: true,
        protocol: 'ASTM / HL7',
        port: '5002',
        autoAcceptResults: false
      }
    };

    const currentSettings = org.settings?.diagnostics || defaultDiagnostics;

    res.status(200).json({
      status: 'success',
      data: {
        organization: {
          name: org.name,
          legalName: org.legalName || org.name,
          email: org.email,
          phone: org.phone || '+91 98765 43210',
          address: org.address || '123 Health Avenue, Medical District',
          city: org.city || 'Kolkata',
          state: org.state || 'West Bengal',
          pincode: org.pincode || '700091',
          gstNumber: org.gstNumber || '19AABCA1234A1Z5',
          logo: org.logo || ''
        },
        settings: currentSettings
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateLabSettings = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { organization, settings } = req.body;

    const org = await Organization.findById(orgId);
    if (!org) return next(new AppError('Organization not found', 404));

    if (organization) {
      if (organization.name) org.name = organization.name;
      if (organization.legalName) org.legalName = organization.legalName;
      if (organization.phone) org.phone = organization.phone;
      if (organization.address) org.address = organization.address;
      if (organization.city) org.city = organization.city;
      if (organization.state) org.state = organization.state;
      if (organization.pincode) org.pincode = organization.pincode;
      if (organization.gstNumber) org.gstNumber = organization.gstNumber;
      if (organization.logo) org.logo = organization.logo;
    }

    if (settings) {
      org.settings = {
        ...(org.settings || {}),
        diagnostics: settings
      };
      org.markModified('settings');
    }

    await org.save();

    res.status(200).json({
      status: 'success',
      message: 'Laboratory settings and letterhead updated successfully',
      data: {
        organization: org,
        settings: org.settings?.diagnostics
      }
    });
  } catch (error) {
    next(error);
  }
};
