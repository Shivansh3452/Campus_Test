const axios=require('axios');
const NOTIFICATION_TYPES = {
    PLACEMENT: 'Placement',
    RESULT: 'Result',
    EVENT: 'Event'
};
const TYPE_WEIGHTS = {
    [NOTIFICATION_TYPES.PLACEMENT]: 3,
    [NOTIFICATION_TYPES.RESULT]: 2,
    [NOTIFICATION_TYPES.EVENT]: 1
};
class PriorityInbox {
    constructor(apiUrl, topN = 10) {
        this.apiUrl = apiUrl;
        this.topN = topN;
        this.notifications = [];
        this.lastFetch = null;
        this.cacheDuration = 60;
    }
    //Fetch notifications from API with caching
    async fetchNotifications() {
        // Check cache
        if (this.lastFetch) {
            const cacheAge = (Date.now() - this.lastFetch) / 1000;
            if (cacheAge < this.cacheDuration) {
                console.log(`Using cached data (${Math.floor(cacheAge)}s old)`);
                return this.notifications;
            }
        }
        try {
            console.log('Fetching fresh data from API...');
            const response = await axios.get(this.apiUrl,{
                headers:{
                    'Accept': 'application/json',
                    'User-Agent': 'CampusNotificationApp/1.0'
                },
                timeout: 10000
            });
            // Validate response
            if (!response.data || !response.data.notifications) {
                console.log('Unexpected API response format');
                return this.notifications;
            }
            // Parse notifications
            const parsed = [];
            for (const item of response.data.notifications) {
                try {
                    //notification type
                    if (!Object.values(NOTIFICATION_TYPES).includes(item.Type)) {
                        console.log(`Unknown type: ${item.Type}`);
                        continue;
                    }
                    parsed.push({
                        id: item.ID,
                        type: item.Type,
                        message: item.Message,
                        timestamp: new Date(item.Timestamp),
                        isRead: false
                    });
                } catch (error) {
                    console.log(`Skipping invalid notification: ${error.message}`);
                    continue;
                }
            }
            this.notifications = parsed;
            this.lastFetch = Date.now();
            console.log(`Fetched ${parsed.length} notifications`);
            return parsed;
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('Cannot connect to API check your internet connection');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('API request timed out');
            } else if (error.response) {
                console.log(`API error: ${error.response.status} - ${error.response.statusText}`);
                if (error.response.status === 401) {
                    console.log('Authentication required - check your API key');
                } else if (error.response.status === 429) {
                    console.log('Rate limited - try again later');
                }
            } else {
                console.log(`API error: ${error.message}`);
            }
            return this.notifications; // Return cached data if available
        }
    }

    /**
     * Calculate priority score based on type, recency, and read status
     */
    calculatePriorityScore(notification) {
        // Type weight
        const typeWeight = TYPE_WEIGHTS[notification.type] || 1;
        const baseScore = typeWeight * 10; // 10, 20, or 30

        // Recency - decays over 24 hours
        const now = new Date();
        const ageHours = (now - notification.timestamp) / (1000 * 60 * 60);
        const recencyFactor = Math.max(0, 1 - (ageHours / 24));
        const recencyScore = recencyFactor * 5; // Max 5 points

        // Unread bonus
        const unreadBonus = notification.isRead ? 0 : 3;

        return baseScore + recencyScore + unreadBonus;
    }

    /**
     * Get top N unread notifications by priority
     */
    getTopNotifications() {
        // Filter unread
        const unread = this.notifications.filter(n => !n.isRead);
        
        if (unread.length === 0) {
            console.log('📭 No unread notifications');
            return [];
        }

        console.log(`📬 Processing ${unread.length} unread notifications`);

        // Sort by score and take top N
        const sorted = [...unread].sort((a, b) => {
            return this.calculatePriorityScore(b) - this.calculatePriorityScore(a);
        });

        return sorted.slice(0, this.topN);
    }
    //heap based implementation for large dataset
    getTopNotificationsWithHeap() {
        const unread = this.notifications.filter(n => !n.isRead);
        
        if (unread.length === 0) {
            return [];
        }

        // Min-heap for top N
        const heap = [];
        
        const heapPush = (item) => {
            const score = this.calculatePriorityScore(item);
            if (heap.length < this.topN) {
                heap.push(item);
                this.heapSortUp(heap, heap.length - 1);
            } else if (score > this.calculatePriorityScore(heap[0])) {
                heap[0] = item;
                this.heapSortDown(heap, 0);
            }
        };
        for (const notif of unread) {
            heapPush(notif);
        }

        // Sort descending by score
        return heap.sort((a, b) => {
            return this.calculatePriorityScore(b) - this.calculatePriorityScore(a);
        });
    }
    heapSortUp(heap, index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.calculatePriorityScore(heap[index]) >= 
                this.calculatePriorityScore(heap[parentIndex])) {
                break;
            }
            [heap[index], heap[parentIndex]] = [heap[parentIndex], heap[index]];
            index = parentIndex;
        }
    }
    heapSortDown(heap, index) {
        while (true) {
            let smallest = index;
            const left = 2 * index + 1;
            const right = 2 * index + 2;
            
            if (left < heap.length && 
                this.calculatePriorityScore(heap[left]) < 
                this.calculatePriorityScore(heap[smallest])) {
                smallest = left;
            }
            if (right < heap.length && 
                this.calculatePriorityScore(heap[right]) < 
                this.calculatePriorityScore(heap[smallest])) {
                smallest = right;
            }
            
            if (smallest === index) break;
            
            [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
            index = smallest;
        }
    }
    //Mark a notification as read
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            console.log(`Marked '${notification.message}' as read`);
            return true;
        }
        console.log(`Notification ${notificationId} not found`);
        return false;
    }
    //Get inbox statistics
    getStatistics() {
        const total = this.notifications.length;
        const unread = this.notifications.filter(n => !n.isRead).length;
        
        // Count by type
        const typeCounts = {};
        for (const n of this.notifications) {
            typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
        }

        return {
            total,
            unread,
            read: total - unread,
            byType: typeCounts,
            topN: this.topN
        };
    }
}

/**
 * Helper function to pretty print a notification
 */
function printNotification(notification, index, showScore = false) {
    const emojis = {
        'Placement': '💼',
        'Result': '📊',
        'Event': '🎉'
    };
    
    const emoji = emojis[notification.type] || '📨';
    const readMarker = notification.isRead ? '📖' : '🔴';
    
    // Format age
    const now = new Date();
    const ageMs = now - notification.timestamp;
    const ageSeconds = Math.floor(ageMs / 1000);
    let ageStr;
    
    if (ageSeconds < 60) {
        ageStr = `${ageSeconds}s ago`;
    } else if (ageSeconds < 3600) {
        ageStr = `${Math.floor(ageSeconds / 60)}m ago`;
    } else if (ageSeconds < 86400) {
        ageStr = `${Math.floor(ageSeconds / 3600)}h ago`;
    } else {
        ageStr = `${Math.floor(ageSeconds / 86400)}d ago`;
    }
    
    const formattedIndex = String(index).padStart(2);
    const paddedType = notification.type.padEnd(10);
    const paddedMessage = notification.message.padEnd(25);
    
    console.log(`${formattedIndex}. ${emoji} ${readMarker} ${paddedType} ${paddedMessage} ${ageStr.padStart(12)}`);
}

/**
 * Main function
 */
async function main() {
    console.log('='.repeat(70));
    console.log('CAMPUS NOTIFICATION PRIORITY INBOX');
    console.log('='.repeat(70));
    
    const API_URL = 'http://4.224.186.213/evaluation-service/notifications';
    
    // Create priority inbox
    const inbox = new PriorityInbox(API_URL, 10);
    
    // Fetch notifications
    console.log('\n📥 Fetching notifications...');
    const notifications = await inbox.fetchNotifications();
    
    if (notifications.length === 0) {
        console.log('\nNo notifications available.');
        console.log('Tips:');
        console.log(' Check if you\'re connected to the internet');
        console.log(' Verify the API URL is correct');
        console.log(' Check if you need to add authentication headers');
        return;
    }
    // Show all notification
    console.log('\n📋 ALL NOTIFICATIONS:');
    console.log('-'.repeat(70));
    notifications.forEach((notif, i) => {
        printNotification(notif, i + 1);
    });
    
    // Get top notifications
    console.log('\nTOP UNREAD NOTIFICATIONS (by priority):');
    console.log('-'.repeat(70));
    
    const topNotifications = inbox.getTopNotifications();
    
    if (topNotifications.length === 0) {
        console.log('No unread notifications found!');
    } else {
        topNotifications.forEach((notif, i) => {
            const score = inbox.calculatePriorityScore(notif);
            printNotification(notif, i + 1);
            
            // Show score breakdown for first few
            if (i < 3) {
                const typeScore = TYPE_WEIGHTS[notif.type] * 10;
                const unreadBonus = notif.isRead ? 0 : 3;
                const recencyScore = score - typeScore - unreadBonus;
                console.log(`      Score: ${score.toFixed(1)} (Type: ${typeScore}, Recency: ${recencyScore.toFixed(1)}, Unread: ${unreadBonus})`);
            }
        });
    }
    
    // Show statistics
    console.log('\nINBOX STATISTICS:');
    console.log('-'.repeat(70));
    const stats = inbox.getStatistics();
    console.log(`  Total: ${stats.total}`);
    console.log(`  Unread: ${stats.unread}`);
    console.log(`  Read: ${stats.read}`);
    console.log(`  By type: ${Object.entries(stats.byType).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
    console.log(`  Top N: ${stats.topN}`);
    
    // Demo mark as read
    if (topNotifications.length > 0) {
        console.log('\nDEMO - Marking top notification as read...');
        const firstNotif = topNotifications[0];
        inbox.markAsRead(firstNotif.id);
        
        console.log('\nUpdated top notifications after marking as read:');
        const updatedTop = inbox.getTopNotifications();
        if (updatedTop.length > 0) {
            printNotification(updatedTop[0], 1);
            console.log(`      Score: ${inbox.calculatePriorityScore(updatedTop[0]).toFixed(1)}`);
        } else {
            console.log('  All caught up! No unread notifications.');
        }
    }
}

// Run the application
main().catch(console.error);

// Export for testing
module.exports = { PriorityInbox, NOTIFICATION_TYPES };