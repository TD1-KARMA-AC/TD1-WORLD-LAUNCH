/**
 * Atlas Ingestion System - Web Crawler
 * 
 * Controlled, scheduled snapshotting of approved domains.
 * Builds the cognitive map from actual web content.
 * 
 * NOTE: This runs separately from the runtime Atlas system.
 * Runtime has zero outbound internet access.
 */

export class AtlasCrawler {
    constructor(config) {
        this.config = {
            allowedDomains: config.allowedDomains || [],
            maxDepth: config.maxDepth || 3,
            rateLimit: config.rateLimit || 1000, // ms between requests
            userAgent: config.userAgent || 'Atlas-Ingestion/1.0',
            ...config
        };
        this.visited = new Set();
        this.queue = [];
    }

    /**
     * Start crawling approved domains
     */
    async startCrawling(startUrls) {
        console.log('Starting Atlas ingestion crawl...');
        
        // Add start URLs to queue
        startUrls.forEach(url => {
            if (this.isAllowed(url)) {
                this.queue.push({ url, depth: 0 });
            }
        });

        // Process queue
        while (this.queue.length > 0) {
            const { url, depth } = this.queue.shift();
            
            if (depth > this.config.maxDepth) continue;
            if (this.visited.has(url)) continue;

            await this.crawlPage(url, depth);
            await this.delay(this.config.rateLimit);
        }

        console.log('Crawl complete.');
    }

    /**
     * Crawl a single page
     */
    async crawlPage(url, depth) {
        this.visited.add(url);
        console.log(`Crawling: ${url} (depth ${depth})`);

        try {
            // In production, would use proper HTTP client
            // For now, this is a structure/example
            const response = await fetch(url, {
                headers: { 'User-Agent': this.config.userAgent }
            });
            
            if (!response.ok) return;

            const html = await response.text();
            const doc = this.parseHTML(html);

            // Extract landmark data
            const landmark = this.extractLandmark(url, doc);

            // Extract links for further crawling
            if (depth < this.config.maxDepth) {
                const links = this.extractLinks(doc, url);
                links.forEach(link => {
                    if (this.isAllowed(link) && !this.visited.has(link)) {
                        this.queue.push({ url: link, depth: depth + 1 });
                    }
                });
            }

            return landmark;
        } catch (error) {
            console.error(`Error crawling ${url}:`, error);
        }
    }

    /**
     * Extract landmark data from page
     */
    extractLandmark(url, doc) {
        return {
            id: this.generateId(url),
            url,
            title: doc.querySelector('title')?.textContent || '',
            summary: doc.querySelector('meta[name="description"]')?.content || '',
            content: doc.body?.textContent?.substring(0, 5000) || '',
            snapshotDate: new Date().toISOString()
        };
    }

    /**
     * Extract links from page
     */
    extractLinks(doc, baseUrl) {
        const links = [];
        const anchorTags = doc.querySelectorAll('a[href]');

        anchorTags.forEach(anchor => {
            const href = anchor.getAttribute('href');
            const absoluteUrl = new URL(href, baseUrl).href;
            links.push(absoluteUrl);
        });

        return links;
    }

    /**
     * Check if URL is allowed
     */
    isAllowed(url) {
        try {
            const urlObj = new URL(url);
            return this.config.allowedDomains.some(domain => 
                urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
            );
        } catch {
            return false;
        }
    }

    /**
     * Parse HTML (simplified - in production would use proper parser)
     */
    parseHTML(html) {
        // In production, use DOMParser or cheerio
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
    }

    /**
     * Generate ID from URL
     */
    generateId(url) {
        return url.replace(/[^a-zA-Z0-9]/g, '_');
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

