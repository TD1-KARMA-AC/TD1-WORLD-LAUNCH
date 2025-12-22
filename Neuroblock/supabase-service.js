// Supabase Service Layer - Transparent Integration
// Works seamlessly with or without Supabase connection
// Users never know it's using Supabase - it just works

class SupabaseService {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.init();
    }
    
    async init() {
        // Check if Supabase is available
        if (typeof window !== 'undefined' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            try {
                // Dynamically load Supabase client from CDN
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
                script.onload = async () => {
                    if (window.supabase && window.supabase.createClient) {
                        this.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                        
                        // Test connection
                        const { data, error } = await this.supabase.from('products').select('count').limit(1);
                        if (!error) {
                            this.isConnected = true;
                            console.log('✅ Supabase connected successfully');
                        } else {
                            console.warn('⚠️ Supabase credentials found but connection failed:', error.message);
                        }
                    }
                };
                document.head.appendChild(script);
            } catch (error) {
                console.warn('⚠️ Supabase not available, using localStorage fallback');
            }
        } else {
            console.log('ℹ️ Supabase not configured, using localStorage fallback');
        }
    }
    
    // Upload product to Supabase (seamless - user doesn't know)
    async uploadProduct(productData, files) {
        if (!this.isConnected) {
            // Fallback to localStorage
            return this.saveToLocalStorage(productData, files);
        }
        
        try {
            // Get current user (or create anonymous session)
            const { data: { user } } = await this.supabase.auth.getUser();
            let userId = user?.id;
            
            // If no user, create anonymous session for upload
            if (!userId) {
                const { data: { session } } = await this.supabase.auth.signInAnonymously();
                userId = session?.user?.id || 'anonymous';
            }
            
            // Upload files to Supabase Storage
            const fileUrls = await this.uploadFiles(files, userId, productData.mode);
            
            // Create product record
            const { data: product, error: productError } = await this.supabase
                .from('products')
                .insert({
                    name: productData.name,
                    description: productData.description,
                    category: productData.category,
                    subcategory: productData.category,
                    creator_id: userId,
                    status: 'pending_review',
                    slug: productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    screenshots: fileUrls.screenshots,
                    videos: fileUrls.videos,
                    demo_url: productData.demoUrl || null
                })
                .select()
                .single();
            
            if (productError) throw productError;
            
            // Create product version
            const { data: version, error: versionError } = await this.supabase
                .from('product_versions')
                .insert({
                    product_id: product.id,
                    version: '1.0.0',
                    submission_mode: productData.mode,
                    creator_access_only: productData.mode === 'sell',
                    storage_path: fileUrls.zipPath,
                    storage_bucket: productData.mode === 'sell' ? 'neuroblocks-private' : 'neuroblocks-contrib',
                    price: productData.mode === 'sell' ? parseFloat(productData.price) : null,
                    license: productData.license || 'Proprietary',
                    tags: productData.tags || [],
                    status: 'pending_review',
                    file_structure: fileUrls.fileStructure || null
                })
                .select()
                .single();
            
            if (versionError) throw versionError;
            
            // Add to validation queue
            await this.supabase
                .from('validation_queue')
                .insert({
                    product_id: product.id,
                    product_version_id: version.id,
                    status: 'pending'
                });
            
            return { success: true, productId: product.id, versionId: version.id };
            
        } catch (error) {
            console.error('Supabase upload error:', error);
            // Fallback to localStorage
            return this.saveToLocalStorage(productData, files);
        }
    }
    
    // Upload files to Supabase Storage
    async uploadFiles(files, userId, mode) {
        const bucket = mode === 'sell' ? 'neuroblocks-private' : 'neuroblocks-contrib';
        const fileUrls = {
            screenshots: [],
            videos: [],
            zipPath: null,
            fileStructure: null
        };
        
        // Upload ZIP file
        if (files.zip) {
            const zipPath = `${userId}/${Date.now()}_${files.zip.name}`;
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(zipPath, files.zip, {
                    contentType: 'application/zip',
                    upsert: false
                });
            
            if (!error) {
                fileUrls.zipPath = zipPath;
                
                // Extract file structure from ZIP (client-side)
                if (files.fileStructure) {
                    fileUrls.fileStructure = files.fileStructure;
                }
            }
        }
        
        // Upload screenshots
        if (files.screenshots && files.screenshots.length > 0) {
            for (const screenshot of files.screenshots) {
                const screenshotPath = `${userId}/screenshots/${Date.now()}_${screenshot.file.name}`;
                const { data, error } = await this.supabase.storage
                    .from('neuroblocks-contrib') // Screenshots are always public
                    .upload(screenshotPath, screenshot.file, {
                        contentType: screenshot.file.type,
                        upsert: false
                    });
                
                if (!error) {
                    const { data: { publicUrl } } = this.supabase.storage
                        .from('neuroblocks-contrib')
                        .getPublicUrl(screenshotPath);
                    fileUrls.screenshots.push({
                        url: publicUrl,
                        caption: screenshot.caption || ''
                    });
                }
            }
        }
        
        // Upload video
        if (files.video && files.video.file) {
            const videoPath = `${userId}/videos/${Date.now()}_${files.video.file.name}`;
            const { data, error } = await this.supabase.storage
                .from('neuroblocks-contrib') // Videos are always public
                .upload(videoPath, files.video.file, {
                    contentType: files.video.file.type,
                    upsert: false
                });
            
            if (!error) {
                const { data: { publicUrl } } = this.supabase.storage
                    .from('neuroblocks-contrib')
                    .getPublicUrl(videoPath);
                fileUrls.videos.push({
                    url: publicUrl,
                    caption: files.video.caption || ''
                });
            }
        }
        
        return fileUrls;
    }
    
    // Fallback to localStorage
    saveToLocalStorage(productData, files) {
        const blocks = JSON.parse(localStorage.getItem('neuroblocks') || '[]');
        
        // Convert file objects to URLs for localStorage
        const screenshotUrls = files.screenshots ? files.screenshots.map(s => {
            if (s.url) return { url: s.url, caption: s.caption || '' };
            if (s.file) return { url: URL.createObjectURL(s.file), caption: s.caption || '' };
            return { url: '', caption: s.caption || '' };
        }) : [];
        
        const videoUrls = files.video && files.video.file ? 
            [{ url: URL.createObjectURL(files.video.file), caption: files.video.caption || '' }] : 
            (files.video && files.video.url ? [{ url: files.video.url, caption: files.video.caption || '' }] : []);
        
        const newBlock = {
            id: 'user-' + Date.now(),
            ...productData,
            creator: 'You',
            rating: 0,
            downloads: 0,
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            featured: false,
            trending: false,
            screenshots: screenshotUrls,
            videos: videoUrls,
            files: files.fileStructure || []
        };
        
        blocks.push(newBlock);
        localStorage.setItem('neuroblocks', JSON.stringify(blocks));
        
        return { success: true, productId: newBlock.id, local: true };
    }
    
    // Get all products (from Supabase or localStorage)
    async getProducts() {
        if (!this.isConnected) {
            return this.getFromLocalStorage();
        }
        
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select(`
                    *,
                    product_versions (
                        version,
                        price,
                        license,
                        tags,
                        status
                    )
                `)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Transform to NeuroBlock format
            return data.map(product => {
                const block = {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    category: product.subcategory || product.category,
                    creator: product.creator_id, // Will need to join with user_profiles
                    price: product.product_versions[0]?.price || 0,
                    rating: product.rating || 0,
                    downloads: product.downloads || 0,
                    version: product.product_versions[0]?.version || '1.0.0',
                    license: product.product_versions[0]?.license || 'Proprietary',
                    tags: product.product_versions[0]?.tags || [],
                    createdAt: product.created_at,
                    featured: product.featured || false,
                    trending: product.trending || false,
                    screenshots: product.screenshots || [],
                    videos: product.videos || [],
                    demoUrl: product.demo_url,
                    files: product.product_versions[0]?.file_structure || []
                };
                // Ensure demo data structure exists
                return ensureDemoData(block);
            });
        } catch (error) {
            console.error('Error fetching from Supabase:', error);
            return this.getFromLocalStorage();
        }
    }
    
    getFromLocalStorage() {
        const blocks = JSON.parse(localStorage.getItem('neuroblocks') || '[]');
        const td1Products = typeof TD1_PRODUCTS !== 'undefined' ? TD1_PRODUCTS : [];
        const allProducts = [...td1Products, ...blocks];
        // Ensure all products have demo data structure
        return allProducts.map(p => ensureDemoData(p));
    }
}

// Helper: Ensure all products have demo data structure
function ensureDemoData(product) {
    if (!product.screenshots || product.screenshots.length === 0) {
        product.screenshots = getDefaultScreenshots(product);
    }
    if (!product.videos) {
        product.videos = [];
    }
    if (!product.files || product.files.length === 0) {
        product.files = getDefaultFileStructure(product);
    }
    return product;
}

// Helper: Get default screenshots
function getDefaultScreenshots(product) {
    return [
        { 
            url: `https://via.placeholder.com/800x450/7C3AED/FFFFFF?text=${encodeURIComponent(product.name)}`, 
            caption: `${product.name} Overview` 
        },
        { 
            url: `https://via.placeholder.com/800x450/7C3AED/FFFFFF?text=${encodeURIComponent(product.name)}+Demo`, 
            caption: 'Demo Preview' 
        }
    ];
}

// Helper: Get default file structure
function getDefaultFileStructure(product) {
    return [
        { name: 'README.md', type: 'file', size: 2048 },
        { name: 'src/', type: 'folder' },
        { name: 'src/main.py', type: 'file', size: 8192 },
        { name: 'requirements.txt', type: 'file', size: 512 },
        { name: 'config.json', type: 'file', size: 1024 }
    ];
}

// Create global instance
const supabaseService = new SupabaseService();

// Make available globally
window.supabaseService = supabaseService;

