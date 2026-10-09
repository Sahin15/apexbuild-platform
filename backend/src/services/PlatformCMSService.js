import PlatformCMSPage from '../models/PlatformCMSPage.js';
import PlatformCMSBlog from '../models/PlatformCMSBlog.js';
import PlatformCMSMedia from '../models/PlatformCMSMedia.js';
import PlatformCMSMenu from '../models/PlatformCMSMenu.js';
import PlatformCMSBanner from '../models/PlatformCMSBanner.js';
import PlatformCMSLandingPage from '../models/PlatformCMSLandingPage.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';

class PlatformCMSService {
  async getPages() {
    return await PlatformCMSPage.find().populate('authorId', 'name email').sort('-createdAt').lean();
  }

  async createPage(data, adminId, ip, userAgent) {
    const slug = data.slug || data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const exists = await PlatformCMSPage.findOne({ slug });
    if (exists) throw new AppError('A page with this slug already exists', 400);

    const page = await PlatformCMSPage.create({
      ...data,
      slug,
      authorId: adminId
    });

    await AuditLog.create({
      action: 'PLATFORM_CMS_PAGE_CREATED',
      adminId,
      entityType: 'PlatformCMSPage',
      entityId: page._id,
      newValue: { title: page.title, slug: page.slug },
      ipAddress: ip,
      userAgent
    });

    return page;
  }

  async updatePageStatus(id, status, adminId, ip, userAgent) {
    const page = await PlatformCMSPage.findByIdAndUpdate(id, { status }, { new: true });
    if (!page) throw new AppError('CMS Page not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_PAGE_STATUS_UPDATED',
      adminId,
      entityType: 'PlatformCMSPage',
      entityId: page._id,
      newValue: { status },
      ipAddress: ip,
      userAgent
    });

    return page;
  }

  async deletePage(id, adminId, ip, userAgent) {
    const page = await PlatformCMSPage.findByIdAndDelete(id);
    if (!page) throw new AppError('CMS Page not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_PAGE_DELETED',
      adminId,
      entityType: 'PlatformCMSPage',
      entityId: id,
      newValue: { deleted: true },
      ipAddress: ip,
      userAgent
    });

    return true;
  }

  // --- BLOG & NEWS ---
  async getPosts() {
    return await PlatformCMSBlog.find().populate('authorId', 'name email').sort('-createdAt').lean();
  }

  async createPost(data, adminId, ip, userAgent) {
    const slug = data.slug || data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const exists = await PlatformCMSBlog.findOne({ slug });
    if (exists) throw new AppError('A blog post with this slug already exists', 400);

    const post = await PlatformCMSBlog.create({
      ...data,
      slug,
      authorId: adminId,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null
    });

    await AuditLog.create({
      action: 'PLATFORM_CMS_BLOG_CREATED',
      adminId,
      entityType: 'PlatformCMSBlog',
      entityId: post._id,
      newValue: { title: post.title, slug: post.slug },
      ipAddress: ip,
      userAgent
    });

    return post;
  }

  async updatePostStatus(id, status, adminId, ip, userAgent) {
    const updateData = { status };
    if (status === 'PUBLISHED') updateData.publishedAt = new Date();

    const post = await PlatformCMSBlog.findByIdAndUpdate(id, updateData, { new: true });
    if (!post) throw new AppError('Blog Post not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_BLOG_STATUS_UPDATED',
      adminId,
      entityType: 'PlatformCMSBlog',
      entityId: post._id,
      newValue: { status },
      ipAddress: ip,
      userAgent
    });

    return post;
  }

  async deletePost(id, adminId, ip, userAgent) {
    const post = await PlatformCMSBlog.findByIdAndDelete(id);
    if (!post) throw new AppError('Blog Post not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_BLOG_DELETED',
      adminId,
      entityType: 'PlatformCMSBlog',
      entityId: id,
      newValue: { deleted: true },
      ipAddress: ip,
      userAgent
    });

    return true;
  }

  // --- MEDIA LIBRARY ---
  async getMedia() {
    return await PlatformCMSMedia.find().populate('uploadedBy', 'name email').sort('-createdAt').lean();
  }

  async createMedia(data, adminId, ip, userAgent) {
    const media = await PlatformCMSMedia.create({
      ...data,
      uploadedBy: adminId
    });

    await AuditLog.create({
      action: 'PLATFORM_CMS_MEDIA_UPLOADED',
      adminId,
      entityType: 'PlatformCMSMedia',
      entityId: media._id,
      newValue: { fileName: media.fileName, url: media.url },
      ipAddress: ip,
      userAgent
    });

    return media;
  }

  async deleteMedia(id, adminId, ip, userAgent) {
    const media = await PlatformCMSMedia.findByIdAndDelete(id);
    if (!media) throw new AppError('Media file not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_MEDIA_DELETED',
      adminId,
      entityType: 'PlatformCMSMedia',
      entityId: id,
      newValue: { deleted: true, fileName: media.fileName },
      ipAddress: ip,
      userAgent
    });

    return true;
  }

  // --- MENUS & NAVIGATION ---
  async getMenus() {
    return await PlatformCMSMenu.find().sort('name').lean();
  }

  async createMenu(data, adminId, ip, userAgent) {
    const menu = await PlatformCMSMenu.create({
      ...data,
      createdBy: adminId
    });

    await AuditLog.create({
      action: 'PLATFORM_CMS_MENU_CREATED',
      adminId,
      entityType: 'PlatformCMSMenu',
      entityId: menu._id,
      newValue: { name: menu.name, location: menu.location },
      ipAddress: ip,
      userAgent
    });

    return menu;
  }

  async updateMenu(id, data, adminId, ip, userAgent) {
    const menu = await PlatformCMSMenu.findByIdAndUpdate(id, {
      ...data,
      updatedBy: adminId
    }, { new: true });
    
    if (!menu) throw new AppError('Menu not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_MENU_UPDATED',
      adminId,
      entityType: 'PlatformCMSMenu',
      entityId: menu._id,
      newValue: { name: menu.name, location: menu.location, linkCount: menu.links.length },
      ipAddress: ip,
      userAgent
    });

    return menu;
  }

  async deleteMenu(id, adminId, ip, userAgent) {
    const menu = await PlatformCMSMenu.findByIdAndDelete(id);
    if (!menu) throw new AppError('Menu not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_MENU_DELETED',
      adminId,
      entityType: 'PlatformCMSMenu',
      entityId: id,
      newValue: { deleted: true, name: menu.name },
      ipAddress: ip,
      userAgent
    });

    return true;
  }

  // --- BANNERS & PROMOTIONS ---
  async getBanners() {
    return await PlatformCMSBanner.find().sort('-createdAt').lean();
  }

  async createBanner(data, adminId, ip, userAgent) {
    const banner = await PlatformCMSBanner.create({
      ...data,
      createdBy: adminId
    });

    await AuditLog.create({
      action: 'PLATFORM_CMS_BANNER_CREATED',
      adminId,
      entityType: 'PlatformCMSBanner',
      entityId: banner._id,
      newValue: { message: banner.message, isActive: banner.isActive },
      ipAddress: ip,
      userAgent
    });

    return banner;
  }

  async updateBanner(id, data, adminId, ip, userAgent) {
    const banner = await PlatformCMSBanner.findByIdAndUpdate(id, {
      ...data,
      updatedBy: adminId
    }, { new: true });
    
    if (!banner) throw new AppError('Banner not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_BANNER_UPDATED',
      adminId,
      entityType: 'PlatformCMSBanner',
      entityId: banner._id,
      newValue: { message: banner.message, isActive: banner.isActive },
      ipAddress: ip,
      userAgent
    });

    return banner;
  }

  async deleteBanner(id, adminId, ip, userAgent) {
    const banner = await PlatformCMSBanner.findByIdAndDelete(id);
    if (!banner) throw new AppError('Banner not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_BANNER_DELETED',
      adminId,
      entityType: 'PlatformCMSBanner',
      entityId: id,
      newValue: { deleted: true, message: banner.message },
      ipAddress: ip,
      userAgent
    });

    return true;
  }

  // --- LANDING PAGES ---
  async getLandingPages() {
    return await PlatformCMSLandingPage.find().sort('-createdAt').lean();
  }

  async createLandingPage(data, adminId, ip, userAgent) {
    const page = await PlatformCMSLandingPage.create({
      ...data,
      createdBy: adminId
    });

    await AuditLog.create({
      action: 'PLATFORM_CMS_LANDING_PAGE_CREATED',
      adminId,
      entityType: 'PlatformCMSLandingPage',
      entityId: page._id,
      newValue: { campaignName: page.campaignName, slug: page.slug },
      ipAddress: ip,
      userAgent
    });

    return page;
  }

  async updateLandingPage(id, data, adminId, ip, userAgent) {
    const page = await PlatformCMSLandingPage.findByIdAndUpdate(id, {
      ...data,
      updatedBy: adminId
    }, { new: true });
    
    if (!page) throw new AppError('Landing Page not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_LANDING_PAGE_UPDATED',
      adminId,
      entityType: 'PlatformCMSLandingPage',
      entityId: page._id,
      newValue: { campaignName: page.campaignName, status: page.status },
      ipAddress: ip,
      userAgent
    });

    return page;
  }

  async deleteLandingPage(id, adminId, ip, userAgent) {
    const page = await PlatformCMSLandingPage.findByIdAndDelete(id);
    if (!page) throw new AppError('Landing Page not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_CMS_LANDING_PAGE_DELETED',
      adminId,
      entityType: 'PlatformCMSLandingPage',
      entityId: id,
      newValue: { deleted: true, slug: page.slug },
      ipAddress: ip,
      userAgent
    });

    return true;
  }
}

export default new PlatformCMSService();
