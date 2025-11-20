// Daily Excel Report Generation Cron Job
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  try {
    const { data: allLicenses } = await supabase
      .from('licenses')
      .select('*')
      .order('issued_at', { ascending: false });

    const now = new Date();
    const activeTrials = allLicenses.filter(l => l.is_trial && l.status === 'active' && new Date(l.expires_at) > now);
    const expiredTrials = allLicenses.filter(l => l.is_trial && (l.status !== 'active' || new Date(l.expires_at) <= now));
    const fullLicenses = allLicenses.filter(l => !l.is_trial && l.status === 'active');
    const activatedLicenses = allLicenses.filter(l => l.device_hash);
    
    // Create comprehensive daily report
    const dailyReport = {
      reportType: 'Daily AutoNestCut Analytics Report',
      generatedAt: now.toISOString(),
      summary: {
        totalLicenses: allLicenses.length,
        activeTrials: activeTrials.length,
        expiredTrials: expiredTrials.length,
        fullLicenses: fullLicenses.length,
        activatedLicenses: activatedLicenses.length,
        unusedLicenses: allLicenses.length - activatedLicenses.length,
        conversionRate: expiredTrials.length > 0 ? Math.round((fullLicenses.length / expiredTrials.length) * 100) : 0,
        activationRate: allLicenses.length > 0 ? Math.round((activatedLicenses.length / allLicenses.length) * 100) : 0,
        avgTrialUsage: activeTrials.length > 0 ? Math.round(
          activeTrials.reduce((sum, trial) => {
            const used = Math.max(0, 7 - Math.ceil((new Date(trial.expires_at) - now) / (24 * 60 * 60 * 1000)));
            return sum + used;
          }, 0) / activeTrials.length
        ) : 0
      },
      trends: {
        newLicensesToday: allLicenses.filter(l => {
          const issued = new Date(l.issued_at);
          const today = new Date();
          return issued.toDateString() === today.toDateString();
        }).length,
        expiringIn7Days: allLicenses.filter(l => {
          if (!l.expires_at) return false;
          const expires = new Date(l.expires_at);
          const daysUntilExpiry = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
        }).length,
        countryBreakdown: {}
      },
      detailedData: allLicenses.map(l => ({
        userName: l.user_name,
        email: l.email,
        licenseKey: l.license_key,
        type: l.is_trial ? 'Trial' : 'Full',
        status: l.status,
        activated: l.device_hash ? 'Yes' : 'No',
        country: l.country || 'Unknown',
        issuedDate: l.issued_at,
        expiresDate: l.expires_at || 'Never',
        remainingDays: l.expires_at ? Math.max(0, Math.ceil((new Date(l.expires_at) - now) / (1000 * 60 * 60 * 24))) : 'Unlimited',
        campaignTag: l.campaign_tag || 'Direct',
        deviceBound: l.device_hash ? 'Yes' : 'No'
      }))
    };

    // Calculate country breakdown
    activatedLicenses.forEach(l => {
      const country = l.country || 'Unknown';
      dailyReport.trends.countryBreakdown[country] = (dailyReport.trends.countryBreakdown[country] || 0) + 1;
    });

    // Store daily report in Supabase Storage
    const fileName = `daily-reports/autonestcut-daily-${now.toISOString().split('T')[0]}.json`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, JSON.stringify(dailyReport, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('Daily report storage error:', uploadError);
      return res.status(500).json({ error: 'Failed to store daily report' });
    }

    console.log(`Daily report generated and stored: ${fileName}`);
    res.json({ 
      success: true, 
      message: 'Daily report generated successfully',
      fileName,
      summary: dailyReport.summary
    });

  } catch (error) {
    console.error('Daily report generation error:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
}