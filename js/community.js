// Community Features Module
const communityModule = {
    // Knowledge sharing system
    posts: [],
    marketplace: [],
    successStories: [],

    // Knowledge sharing
    createPost(author, content, category) {
        const post = {
            id: Date.now(),
            author,
            content,
            category,
            likes: 0,
            comments: [],
            timestamp: new Date().toISOString()
        };
        this.posts.push(post);
        this.updateKnowledgeBoard();
        return post;
    },

    // Marketplace
    listProduct(farmer, product, price, quantity) {
        const listing = {
            id: Date.now(),
            farmer,
            product,
            price,
            quantity,
            status: 'available',
            timestamp: new Date().toISOString()
        };
        this.marketplace.push(listing);
        this.updateMarketplace();
        return listing;
    },

    // Success stories
    shareSuccessStory(farmer, title, content, images) {
        const story = {
            id: Date.now(),
            farmer,
            title,
            content,
            images,
            likes: 0,
            comments: [],
            timestamp: new Date().toISOString()
        };
        this.successStories.push(story);
        this.updateSuccessStories();
        return story;
    },

    // UI Updates
    updateKnowledgeBoard() {
        const board = document.getElementById('knowledge-board');
        if (board) {
            board.innerHTML = this.posts
                .map(post => this.createPostHTML(post))
                .join('');
        }
    },

    updateMarketplace() {
        const market = document.getElementById('marketplace');
        if (market) {
            market.innerHTML = this.marketplace
                .map(listing => this.createListingHTML(listing))
                .join('');
        }
    },

    updateSuccessStories() {
        const stories = document.getElementById('success-stories');
        if (stories) {
            stories.innerHTML = this.successStories
                .map(story => this.createStoryHTML(story))
                .join('');
        }
    },

    // HTML Generators
    createPostHTML(post) {
        return `
            <div class="post" data-id="${post.id}">
                <h3>${post.author}</h3>
                <p>${post.content}</p>
                <div class="post-meta">
                    <span>${post.category}</span>
                    <span>${post.likes} likes</span>
                    <button onclick="likePost(${post.id})">Like</button>
                </div>
            </div>
        `;
    },

    createListingHTML(listing) {
        return `
            <div class="listing" data-id="${listing.id}">
                <h3>${listing.product}</h3>
                <p>Farmer: ${listing.farmer}</p>
                <p>Price: $${listing.price}</p>
                <p>Quantity: ${listing.quantity}</p>
                <button onclick="contactSeller(${listing.id})">Contact Seller</button>
            </div>
        `;
    },

    createStoryHTML(story) {
        return `
            <div class="success-story" data-id="${story.id}">
                <h3>${story.title}</h3>
                <p>By ${story.farmer}</p>
                <div class="story-content">${story.content}</div>
                <div class="story-images">
                    ${story.images.map(img => `<img src="${img}" alt="Success story image">`).join('')}
                </div>
            </div>
        `;
    }
};

// Initialize community features
document.addEventListener('DOMContentLoaded', () => {
    // Example content
    communityModule.createPost('John Farmer', 'Great results with companion planting!', 'Organic Farming');
    communityModule.listProduct('Mary\'s Farm', 'Organic Tomatoes', 2.99, 100);
    communityModule.shareSuccessStory('Bob\'s Ranch', 'Successful Transition to Organic', 'Our journey to organic farming...', []);
});

// Export module
export default communityModule;
