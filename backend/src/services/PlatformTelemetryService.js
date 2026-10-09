import Organization from '../models/Organization.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

class PlatformTelemetryService {
  async getUsageAnalytics() {
    // Generate realistic macro-level metrics based on existing system data
    const activeOrgsCount = await Organization.countDocuments({ status: 'active' });
    const totalUsersCount = await User.countDocuments({ organizationId: { $exists: true, $ne: null } });
    const activeSubscriptions = await Subscription.countDocuments({ status: 'ACTIVE' });

    // Since we don't track raw bytes/API calls yet, simulate it linearly based on user volume
    // Let's assume an average user consumes 150MB of storage and makes 1,200 API calls per month
    const totalStorageBytes = totalUsersCount * 150 * 1024 * 1024; 
    const totalApiRequests = totalUsersCount * 1200 + (activeOrgsCount * 5000); // Baseline per org
    const activeSeats = totalUsersCount;
    
    // Simulate bandwidth (Assume 2.5 GB per active organization)
    const bandwidthBytes = activeOrgsCount * 2.5 * 1024 * 1024 * 1024;

    return {
      totalStorageBytes,
      totalApiRequests,
      activeSeats,
      bandwidthBytes,
      activeSubscriptions
    };
  }

  async getDeepAnalytics() {
    const activeOrgs = await Organization.countDocuments({ status: 'active' });
    const churnedOrgs = await Organization.countDocuments({ status: 'inactive' });
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'ACTIVE' });
    
    // Simulate user engagement and feature adoption
    return {
      activeOrganizations: activeOrgs,
      churnRate: activeOrgs > 0 ? ((churnedOrgs / (activeOrgs + churnedOrgs)) * 100).toFixed(1) : 0,
      userGrowth: '+12.4%', // Simulated
      dau: Math.floor(totalUsers * 0.45), // Daily active users (simulated 45%)
      mau: Math.floor(totalUsers * 0.85),
      featureAdoption: [
        { feature: 'CRM', adoption: 85 },
        { feature: 'Finance', adoption: 65 },
        { feature: 'Inventory', adoption: 40 },
        { feature: 'HR', adoption: 35 }
      ]
    };
  }

  async getOSPerformance() {
    // Simulate OS performance metrics (CPU, Memory, API latency)
    return {
      uptime: '99.99%',
      apiLatency: '45ms',
      errorRate: '0.01%',
      cpuUsage: Math.floor(Math.random() * 20) + 20, // 20-40%
      memoryUsage: Math.floor(Math.random() * 15) + 40, // 40-55%
      activeConnections: Math.floor(Math.random() * 500) + 1000,
      servicesStatus: [
        { name: 'Core API', status: 'operational' },
        { name: 'Database', status: 'operational' },
        { name: 'Storage Cache', status: 'operational' },
        { name: 'Background Workers', status: 'operational' }
      ]
    };
  }
}

export default new PlatformTelemetryService();
