// Global variables
let sentimentData = [];
let isMonitoring = false;
let updateInterval;
let charts = {};
let currentDataIndex = 0;
let displayedPosts = [];
let filteredPosts = [];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await loadSentimentData();
    initializeCharts();
    initializeEventListeners();
    updateMetrics();
    updateAnalytics();
    displayPosts();
});

// Load sentiment data from the provided JSON
async function loadSentimentData() {
    try {
        const response = await fetch('https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/7bc74c79deb4c98848a63b755dc928b7/1bb7a55d-aa8b-4e26-9795-d81159db982a/5c91624f.json');
        sentimentData = await response.json();
        
        // Add some additional simulated data points for better real-time effect
        const additionalData = generateAdditionalSentimentData(50);
        sentimentData = [...sentimentData, ...additionalData];
        
        console.log('Sentiment data loaded:', sentimentData.length, 'posts');
    } catch (error) {
        console.error('Error loading sentiment data:', error);
        // Fallback to embedded data if external fetch fails
        sentimentData = [
            {"id": "post_1", "text": "I love this new product! It's amazing and works perfectly!", "timestamp": "2025-09-09 10:40:26", "source": "reddit", "sentiment": "positive", "confidence": 0.652, "user_followers": 7598, "retweets": 471, "likes": 711},
            {"id": "post_2", "text": "This is terrible. Worst experience ever.", "timestamp": "2025-09-09 18:35:10", "source": "twitter", "sentiment": "negative", "confidence": 0.883, "user_followers": 3542, "retweets": 12, "likes": 45},
            {"id": "post_3", "text": "The weather is nice today. Going for a walk.", "timestamp": "2025-09-09 14:22:33", "source": "instagram", "sentiment": "neutral", "confidence": 0.721, "user_followers": 892, "retweets": 3, "likes": 67}
        ];
    }
}

// Generate additional sentiment data for better simulation
function generateAdditionalSentimentData(count) {
    const positiveTexts = [
        "Excellent service! Highly recommend!",
        "Best purchase I've made this year!",
        "Outstanding quality and fast delivery",
        "Five stars! Will buy again",
        "Amazing product, exceeded expectations"
    ];
    
    const negativeTexts = [
        "Waste of money, very disappointed",
        "Poor quality, broke after one day", 
        "Customer service is terrible",
        "Not worth the price at all",
        "Worst product I've ever bought"
    ];
    
    const neutralTexts = [
        "It's okay, nothing special though",
        "Average product for the price",
        "Decent but could be better",
        "Not bad, not great either",
        "Standard quality, as expected"
    ];
    
    const sources = ['twitter', 'reddit', 'instagram', 'facebook'];
    const additional = [];
    
    for (let i = 0; i < count; i++) {
        const sentiment = Math.random() < 0.4 ? 'positive' : Math.random() < 0.7 ? 'negative' : 'neutral';
        let text, confidence;
        
        switch (sentiment) {
            case 'positive':
                text = positiveTexts[Math.floor(Math.random() * positiveTexts.length)];
                confidence = 0.7 + Math.random() * 0.3;
                break;
            case 'negative':
                text = negativeTexts[Math.floor(Math.random() * negativeTexts.length)];
                confidence = 0.6 + Math.random() * 0.35;
                break;
            default:
                text = neutralTexts[Math.floor(Math.random() * neutralTexts.length)];
                confidence = 0.5 + Math.random() * 0.4;
        }
        
        const now = new Date();
        now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 1440)); // Random time in last 24 hours
        
        additional.push({
            id: `generated_${i}`,
            text: text,
            timestamp: now.toISOString().slice(0, 19).replace('T', ' '),
            source: sources[Math.floor(Math.random() * sources.length)],
            sentiment: sentiment,
            confidence: Math.round(confidence * 1000) / 1000,
            user_followers: Math.floor(Math.random() * 10000) + 100,
            retweets: Math.floor(Math.random() * 500),
            likes: Math.floor(Math.random() * 1000)
        });
    }
    
    return additional;
}

// Initialize all charts
function initializeCharts() {
    initializeSentimentGauge();
    initializeSentimentPie();
    initializeTimeSeriesChart();
    initializeVolumeChart();
    initializeSourceChart();
    initializeConfidenceChart();
}

// Initialize sentiment gauge chart
function initializeSentimentGauge() {
    const ctx = document.getElementById('sentimentGauge').getContext('2d');
    
    charts.gauge = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [50, 50],
                backgroundColor: ['#1FB8CD', '#2A2A2A'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
}

// Initialize sentiment distribution pie chart
function initializeSentimentPie() {
    const ctx = document.getElementById('sentimentPie').getContext('2d');
    
    charts.pie = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Positive', 'Negative', 'Neutral'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#1FB8CD', '#FF5459', '#FFC185'],
                borderColor: '#2A2A2A',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#F5F5F5',
                        padding: 20
                    }
                }
            }
        }
    });
}

// Initialize time series chart
function initializeTimeSeriesChart() {
    const ctx = document.getElementById('timeSeriesChart').getContext('2d');
    
    charts.timeSeries = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sentiment Score',
                data: [],
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    min: -1,
                    max: 1,
                    ticks: {
                        color: '#F5F5F5'
                    },
                    grid: {
                        color: 'rgba(245, 245, 245, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#F5F5F5'
                    },
                    grid: {
                        color: 'rgba(245, 245, 245, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#F5F5F5'
                    }
                }
            }
        }
    });
}

// Initialize volume chart
function initializeVolumeChart() {
    const ctx = document.getElementById('volumeChart').getContext('2d');
    
    charts.volume = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Posts per Hour',
                data: [],
                backgroundColor: '#1FB8CD',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#F5F5F5'
                    },
                    grid: {
                        color: 'rgba(245, 245, 245, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#F5F5F5'
                    },
                    grid: {
                        color: 'rgba(245, 245, 245, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#F5F5F5'
                    }
                }
            }
        }
    });
}

// Initialize source chart
function initializeSourceChart() {
    const ctx = document.getElementById('sourceChart').getContext('2d');
    
    charts.source = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Twitter', 'Reddit', 'Instagram', 'Facebook'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F'],
                borderColor: '#2A2A2A',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#F5F5F5',
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

// Initialize confidence chart
function initializeConfidenceChart() {
    const ctx = document.getElementById('confidenceChart').getContext('2d');
    
    charts.confidence = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0'],
            datasets: [{
                label: 'Posts',
                data: [0, 0, 0, 0, 0],
                backgroundColor: '#1FB8CD',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#F5F5F5'
                    },
                    grid: {
                        color: 'rgba(245, 245, 245, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#F5F5F5'
                    },
                    grid: {
                        color: 'rgba(245, 245, 245, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Start/Stop monitoring
    document.getElementById('startBtn').addEventListener('click', startMonitoring);
    document.getElementById('stopBtn').addEventListener('click', stopMonitoring);
    
    // Confidence threshold slider
    const thresholdSlider = document.getElementById('confidenceThreshold');
    thresholdSlider.addEventListener('input', (e) => {
        document.getElementById('thresholdValue').textContent = e.target.value;
        filterPostsByConfidence();
    });
    
    // Sentiment filter
    document.getElementById('sentimentFilter').addEventListener('change', filterPosts);
    
    // Time range selector
    document.getElementById('timeRange').addEventListener('change', updateCharts);
    
    // Export and refresh buttons
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('refreshBtn').addEventListener('click', refreshAnalytics);
    
    // Auto-refresh toggle
    document.getElementById('autoRefresh').addEventListener('change', toggleAutoRefresh);
}

// Start monitoring
function startMonitoring() {
    isMonitoring = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.classList.add('active');
    document.getElementById('statusText').textContent = 'Monitoring';
    
    // Start real-time updates
    updateInterval = setInterval(() => {
        simulateRealtimeUpdate();
        updateCharts();
        updateMetrics();
        if (document.getElementById('autoRefresh').checked) {
            displayPosts();
        }
    }, 3000); // Update every 3 seconds
    
    // Initial update
    simulateRealtimeUpdate();
    updateCharts();
}

// Stop monitoring
function stopMonitoring() {
    isMonitoring = false;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.classList.remove('active');
    document.getElementById('statusText').textContent = 'Stopped';
    
    if (updateInterval) {
        clearInterval(updateInterval);
    }
}

// Simulate real-time data updates
function simulateRealtimeUpdate() {
    if (!isMonitoring) return;
    
    // Add a new random post from our dataset
    const randomIndex = Math.floor(Math.random() * sentimentData.length);
    const newPost = { ...sentimentData[randomIndex] };
    
    // Update timestamp to current time
    newPost.timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    newPost.id = `realtime_${Date.now()}_${Math.random()}`;
    
    // Add to displayed posts
    displayedPosts.unshift(newPost);
    
    // Limit displayed posts to last 50
    if (displayedPosts.length > 50) {
        displayedPosts = displayedPosts.slice(0, 50);
    }
}

// Update metrics
function updateMetrics() {
    const posts = displayedPosts.length > 0 ? displayedPosts : sentimentData;
    const total = posts.length;
    
    if (total === 0) {
        document.getElementById('totalPosts').textContent = '0';
        document.getElementById('positivePercent').textContent = '0%';
        document.getElementById('negativePercent').textContent = '0%';
        document.getElementById('neutralPercent').textContent = '0%';
        return;
    }
    
    const positive = posts.filter(p => p.sentiment === 'positive').length;
    const negative = posts.filter(p => p.sentiment === 'negative').length;
    const neutral = posts.filter(p => p.sentiment === 'neutral').length;
    
    document.getElementById('totalPosts').textContent = total.toLocaleString();
    document.getElementById('positivePercent').textContent = Math.round((positive / total) * 100) + '%';
    document.getElementById('negativePercent').textContent = Math.round((negative / total) * 100) + '%';
    document.getElementById('neutralPercent').textContent = Math.round((neutral / total) * 100) + '%';
    
    // Update sentiment gauge
    const overallScore = calculateOverallSentiment(posts);
    updateSentimentGauge(overallScore);
}

// Calculate overall sentiment score
function calculateOverallSentiment(posts) {
    let score = 0;
    posts.forEach(post => {
        switch (post.sentiment) {
            case 'positive':
                score += post.confidence;
                break;
            case 'negative':
                score -= post.confidence;
                break;
            default:
                // neutral doesn't change score
        }
    });
    return posts.length > 0 ? Math.max(-1, Math.min(1, score / posts.length)) : 0;
}

// Update sentiment gauge
function updateSentimentGauge(score) {
    const normalizedScore = (score + 1) / 2; // Convert -1,1 to 0,1
    const percentage = normalizedScore * 100;
    
    charts.gauge.data.datasets[0].data = [percentage, 100 - percentage];
    charts.gauge.update('none');
    
    document.getElementById('gaugeValue').textContent = score.toFixed(2);
}

// Update all charts
function updateCharts() {
    const posts = displayedPosts.length > 0 ? displayedPosts : sentimentData;
    updateSentimentPieChart(posts);
    updateTimeSeriesChart(posts);
    updateVolumeChart(posts);
    updateSourceChart(posts);
    updateConfidenceChart(posts);
}

// Update sentiment pie chart
function updateSentimentPieChart(posts) {
    const positive = posts.filter(p => p.sentiment === 'positive').length;
    const negative = posts.filter(p => p.sentiment === 'negative').length;
    const neutral = posts.filter(p => p.sentiment === 'neutral').length;
    
    charts.pie.data.datasets[0].data = [positive, negative, neutral];
    charts.pie.update('none');
}

// Update time series chart
function updateTimeSeriesChart(posts) {
    const timeRange = parseInt(document.getElementById('timeRange').value);
    const now = new Date();
    const startTime = new Date(now.getTime() - timeRange * 60 * 60 * 1000);
    
    // Group posts by hour
    const hourlyData = {};
    posts.forEach(post => {
        const postTime = new Date(post.timestamp);
        if (postTime >= startTime) {
            const hour = new Date(postTime.getFullYear(), postTime.getMonth(), postTime.getDate(), postTime.getHours());
            const hourKey = hour.toISOString().slice(0, 13);
            
            if (!hourlyData[hourKey]) {
                hourlyData[hourKey] = [];
            }
            hourlyData[hourKey].push(post);
        }
    });
    
    // Calculate sentiment scores for each hour
    const labels = [];
    const data = [];
    
    for (let i = timeRange; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        hour.setMinutes(0, 0, 0);
        const hourKey = hour.toISOString().slice(0, 13);
        
        labels.push(hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        
        if (hourlyData[hourKey]) {
            const score = calculateOverallSentiment(hourlyData[hourKey]);
            data.push(score);
        } else {
            data.push(0);
        }
    }
    
    charts.timeSeries.data.labels = labels;
    charts.timeSeries.data.datasets[0].data = data;
    charts.timeSeries.update('none');
}

// Update volume chart
function updateVolumeChart(posts) {
    const timeRange = parseInt(document.getElementById('timeRange').value);
    const now = new Date();
    const startTime = new Date(now.getTime() - timeRange * 60 * 60 * 1000);
    
    // Group posts by hour
    const hourlyVolume = {};
    posts.forEach(post => {
        const postTime = new Date(post.timestamp);
        if (postTime >= startTime) {
            const hour = new Date(postTime.getFullYear(), postTime.getMonth(), postTime.getDate(), postTime.getHours());
            const hourKey = hour.toISOString().slice(0, 13);
            
            hourlyVolume[hourKey] = (hourlyVolume[hourKey] || 0) + 1;
        }
    });
    
    const labels = [];
    const data = [];
    
    for (let i = Math.min(timeRange, 12); i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        hour.setMinutes(0, 0, 0);
        const hourKey = hour.toISOString().slice(0, 13);
        
        labels.push(hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        data.push(hourlyVolume[hourKey] || 0);
    }
    
    charts.volume.data.labels = labels;
    charts.volume.data.datasets[0].data = data;
    charts.volume.update('none');
}

// Update source chart
function updateSourceChart(posts) {
    const sourceCounts = { twitter: 0, reddit: 0, instagram: 0, facebook: 0 };
    
    posts.forEach(post => {
        if (sourceCounts.hasOwnProperty(post.source)) {
            sourceCounts[post.source]++;
        }
    });
    
    charts.source.data.datasets[0].data = [
        sourceCounts.twitter,
        sourceCounts.reddit,
        sourceCounts.instagram,
        sourceCounts.facebook
    ];
    charts.source.update('none');
}

// Update confidence chart
function updateConfidenceChart(posts) {
    const confidenceBuckets = [0, 0, 0, 0, 0];
    
    posts.forEach(post => {
        const confidence = post.confidence;
        if (confidence >= 0 && confidence < 0.2) confidenceBuckets[0]++;
        else if (confidence >= 0.2 && confidence < 0.4) confidenceBuckets[1]++;
        else if (confidence >= 0.4 && confidence < 0.6) confidenceBuckets[2]++;
        else if (confidence >= 0.6 && confidence < 0.8) confidenceBuckets[3]++;
        else if (confidence >= 0.8 && confidence <= 1.0) confidenceBuckets[4]++;
    });
    
    charts.confidence.data.datasets[0].data = confidenceBuckets;
    charts.confidence.update('none');
}

// Display posts in the feed
function displayPosts() {
    const posts = displayedPosts.length > 0 ? displayedPosts : sentimentData;
    const threshold = parseFloat(document.getElementById('confidenceThreshold').value);
    const sentimentFilter = document.getElementById('sentimentFilter').value;
    
    // Filter posts
    filteredPosts = posts.filter(post => {
        if (post.confidence < threshold) return false;
        if (sentimentFilter !== 'all' && post.sentiment !== sentimentFilter) return false;
        return true;
    });
    
    const feed = document.getElementById('postsFeed');
    feed.innerHTML = '';
    
    // Display latest 20 posts
    const postsToShow = filteredPosts.slice(0, 20);
    
    postsToShow.forEach(post => {
        const postElement = createPostElement(post);
        feed.appendChild(postElement);
    });
}

// Create post element
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-item fade-in';
    
    const timeAgo = getTimeAgo(post.timestamp);
    const confidencePercent = Math.round(post.confidence * 100);
    
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-meta">
                <span class="sentiment-badge ${post.sentiment}">${post.sentiment}</span>
                <span>${post.source}</span>
                <span>${timeAgo}</span>
            </div>
            <span class="confidence">${confidencePercent}% confidence</span>
        </div>
        <div class="post-text">${post.text}</div>
        <div class="post-stats">
            <span>👥 ${post.user_followers.toLocaleString()} followers</span>
            <span>🔄 ${post.retweets} shares</span>
            <span>❤️ ${post.likes} likes</span>
        </div>
    `;
    
    return postDiv;
}

// Get time ago string
function getTimeAgo(timestamp) {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now - postTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

// Filter posts by confidence
function filterPostsByConfidence() {
    displayPosts();
}

// Filter posts by sentiment
function filterPosts() {
    displayPosts();
}

// Update analytics
function updateAnalytics() {
    const posts = displayedPosts.length > 0 ? displayedPosts : sentimentData;
    
    // Find top positive and negative posts
    const positivePosts = posts.filter(p => p.sentiment === 'positive').sort((a, b) => b.confidence - a.confidence);
    const negativePosts = posts.filter(p => p.sentiment === 'negative').sort((a, b) => b.confidence - a.confidence);
    
    const topPositiveElement = document.getElementById('topPositive');
    const topNegativeElement = document.getElementById('topNegative');
    
    if (positivePosts.length > 0) {
        const topPos = positivePosts[0];
        topPositiveElement.innerHTML = `
            <div class="post-text">"${topPos.text}"</div>
            <div class="post-meta">${topPos.source} • ${Math.round(topPos.confidence * 100)}% confidence</div>
        `;
    } else {
        topPositiveElement.innerHTML = 'No positive posts found';
    }
    
    if (negativePosts.length > 0) {
        const topNeg = negativePosts[0];
        topNegativeElement.innerHTML = `
            <div class="post-text">"${topNeg.text}"</div>
            <div class="post-meta">${topNeg.source} • ${Math.round(topNeg.confidence * 100)}% confidence</div>
        `;
    } else {
        topNegativeElement.innerHTML = 'No negative posts found';
    }
}

// Export data (simulated)
function exportData() {
    const posts = displayedPosts.length > 0 ? displayedPosts : sentimentData;
    const dataStr = JSON.stringify(posts, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'sentiment_analysis_data.json';
    link.click();
    
    // Show feedback
    const btn = document.getElementById('exportBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Exported!';
    btn.style.backgroundColor = '#1FB8CD';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 2000);
}

// Refresh analytics
function refreshAnalytics() {
    updateAnalytics();
    updateCharts();
    
    // Show feedback
    const btn = document.getElementById('refreshBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Refreshed!';
    btn.style.backgroundColor = '#1FB8CD';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 2000);
}

// Toggle auto-refresh
function toggleAutoRefresh() {
    const isEnabled = document.getElementById('autoRefresh').checked;
    console.log('Auto-refresh', isEnabled ? 'enabled' : 'disabled');
}