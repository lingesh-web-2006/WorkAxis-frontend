import React, { useState, useEffect } from 'react';
import { companyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CompanyProfile() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState({
    companyName: '',
    companyAddress: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    taxId: '',
    registrationNumber: '',
    currency: 'INR',
    currencySymbol: '₹',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    companyService.getSettings()
      .then(res => setSettings(res.data))
      .catch(() => toast.error('Failed to load company settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companyService.updateSettings(settings);
      toast.success('Company settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Company Profile</div>
            <div className="card-subtitle">Manage organization details and branding</div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="form-section">
              <div className="section-title">General Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input 
                    className="form-control" 
                    value={settings.companyName} 
                    onChange={e => setSettings({...settings, companyName: e.target.value})}
                    required
                    disabled={!isAdmin()}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input 
                    className="form-control" 
                    value={settings.website} 
                    onChange={e => setSettings({...settings, website: e.target.value})}
                    placeholder="https://example.com"
                    disabled={!isAdmin()}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input 
                    className="form-control" 
                    type="email"
                    value={settings.contactEmail} 
                    onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                    disabled={!isAdmin()}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input 
                    className="form-control" 
                    value={settings.contactPhone} 
                    onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                    disabled={!isAdmin()}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                 <label className="form-label">Office Address</label>
                 <textarea 
                    className="form-control" 
                    rows="2"
                    value={settings.companyAddress} 
                    onChange={e => setSettings({...settings, companyAddress: e.target.value})}
                    disabled={!isAdmin()}
                 />
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '24px' }}>
              <div className="section-title">Tax & Registration</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tax ID / GSTIN</label>
                  <input 
                    className="form-control" 
                    value={settings.taxId} 
                    onChange={e => setSettings({...settings, taxId: e.target.value})}
                    disabled={!isAdmin()}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Number</label>
                  <input 
                    className="form-control" 
                    value={settings.registrationNumber} 
                    onChange={e => setSettings({...settings, registrationNumber: e.target.value})}
                    disabled={!isAdmin()}
                  />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '24px' }}>
              <div className="section-title">Localization</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Currency Code</label>
                  <input 
                    className="form-control" 
                    value={settings.currency} 
                    onChange={e => setSettings({...settings, currency: e.target.value})}
                    placeholder="INR"
                    disabled={!isAdmin()}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency Symbol</label>
                  <input 
                    className="form-control" 
                    value={settings.currencySymbol} 
                    onChange={e => setSettings({...settings, currencySymbol: e.target.value})}
                    placeholder="₹"
                    disabled={!isAdmin()}
                  />
                </div>
              </div>
            </div>
          </div>
          {isAdmin() && (
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
