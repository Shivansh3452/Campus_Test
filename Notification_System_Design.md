The core challenge was to create a system that identifies the most important unread notifications based on two primary factors: notification type priority and recency. The user should be able to configure how many top notifications to display (e.g., top 10, 15, 20).

1.Priority Scoring Algorithm

Designed a weighted scoring system that combines multiple factors:
    Priority Score = (Type_Weight × 10) + (Recency_Factor × 5) + (Unread_Bonus)

Type Weight (3, 2, 1): Multiplied by 10 to give it significant influence (30, 20, 10 points). This ensures placement notifications always outrank results, which outrank events, even if they're slightly older.

Recency Factor (0 to 1): Uses exponential decay over 24 hours. A notification from 1 hour ago gets ~0.96, while one from 23 hours ago gets ~0.04. This creates a natural "freshness" curve - important but old notifications don't stay at the top forever.

2.Algo choice of Heap
Min Heap approach was used for minimum complexity

3.API Integration with Pagination
    Query Parameter Support
        export const notificationAPI = {
            async getNotifications({ limit = 20, page = 1 } = {}) {
                const response = await apiClient.get('/notifications', {
                params: { limit, page }
                });
                return response.data;
            }
        };

4.Error Catching 
    try-catch blocks used for error catching

5.Priority Inbox Implementation
    State Management Approach
    Used React Context for global state management instead of Redux because:
    Simpler for this use case (not too complex)