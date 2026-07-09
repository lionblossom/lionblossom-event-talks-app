// Application State
let releaseNotes = [];
let selectedNotes = new Set(); // Stores note indexes or unique identifiers
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const notesGrid = document.getElementById('notes-grid');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const refreshBtn = document.getElementById('refresh-btn');
const statusText = document.getElementById('status-text');
const statusDot = document.querySelector('.status-dot');

// Stat values
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statChanges = document.getElementById('stat-changes');
const statTime = document.getElementById('stat-time');

// Controls
const searchInput = document.getElementById('search-input');
const filterChips = document.querySelectorAll('.filter-chip');
const selectAllBtn = document.getElementById('select-all-btn');
const clearSelectionBtn = document.getElementById('clear-selection-btn');
const selectedCountBadge = document.getElementById('selected-count-badge');
const composeTweetBtn = document.getElementById('compose-tweet-btn');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const tweetTextarea = document.getElementById('tweet-textarea');
const tweetWebBtn = document.getElementById('tweet-web-btn');
const modalSelectedList = document.getElementById('modal-selected-list');
const charCountText = document.getElementById('char-count-text');

// Circle Progress Ring for Tweet Char Counter
const circle = document.querySelector('.progress-ring__circle');
if (circle) {
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}

// Fetch Release Notes
async function fetchReleaseNotes() {
    try {
        setLoading(true);
        const response = await fetch('/api/release-notes');
        const result = await response.json();
        
        if (result.status === 'success') {
            // Assign unique ID to each note for selection tracking
            releaseNotes = result.data.map((note, index) => ({
                ...note,
                id: `note-${index}`
            }));
            
            updateStats(result);
            renderNotes();
            showToast('Feed refreshed successfully!');
        } else {
            throw new Error('Failed to fetch release notes');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showToast('Error fetching release notes. Please try again.', true);
        setEmptyState(true);
    } finally {
        setLoading(false);
    }
}

// Update Stats UI
function updateStats(result) {
    statTotal.textContent = result.count;
    
    const features = result.data.filter(n => n.category.toLowerCase().includes('feature')).length;
    const changes = result.data.filter(n => n.category.toLowerCase().includes('change')).length;
    
    statFeatures.textContent = features;
    statChanges.textContent = changes;
    
    // Display short time
    const now = new Date();
    statTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    statusText.textContent = `Updated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    statusDot.className = 'status-dot';
}

// Set Loading UI State
function setLoading(isLoading) {
    if (isLoading) {
        refreshBtn.disabled = true;
        refreshBtn.querySelector('.spinner-icon').classList.add('spin');
        statusDot.className = 'status-dot loading';
        statusText.textContent = 'Updating feed...';
        
        notesGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
        loadingState.classList.remove('hidden');
    } else {
        refreshBtn.disabled = false;
        refreshBtn.querySelector('.spinner-icon').classList.remove('spin');
        statusDot.className = 'status-dot';
        loadingState.classList.add('hidden');
    }
}

// Helper to check if a note matches filters
function matchesFilter(note) {
    const category = note.category.toLowerCase();
    
    // Category filter matching
    let matchesCategory = false;
    if (currentFilter === 'all') {
        matchesCategory = true;
    } else if (currentFilter === 'feature') {
        matchesCategory = category.includes('feature');
    } else if (currentFilter === 'change') {
        matchesCategory = category.includes('change');
    } else if (currentFilter === 'deprecation') {
        matchesCategory = category.includes('deprecation') || category.includes('disable');
    }
    
    // Search query matching
    let matchesSearch = true;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const textToSearch = `${note.category} ${note.date} ${note.content_text}`.toLowerCase();
        matchesSearch = textToSearch.includes(query);
    }
    
    return matchesCategory && matchesSearch;
}

// Get currently filtered visible notes
function getVisibleNotes() {
    return releaseNotes.filter(matchesFilter);
}

// Render release notes to grid
function renderNotes() {
    const visibleNotes = getVisibleNotes();
    
    if (visibleNotes.length === 0) {
        setEmptyState(true);
        return;
    }
    
    setEmptyState(false);
    notesGrid.innerHTML = '';
    
    visibleNotes.forEach(note => {
        const isSelected = selectedNotes.has(note.id);
        const cardClass = getCardClassForCategory(note.category);
        
        const card = document.createElement('div');
        card.className = `note-card glass-panel ${cardClass} ${isSelected ? 'selected' : ''}`;
        card.dataset.id = note.id;
        
        card.innerHTML = `
            <div class="card-select-col">
                <label class="custom-checkbox">
                    <input type="checkbox" class="note-checkbox" data-id="${note.id}" ${isSelected ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
            </div>
            
            <div class="card-content-col">
                <div class="card-header">
                    <div class="card-meta-left">
                        <span class="category-badge">${note.category}</span>
                        <span class="card-date">${note.date}</span>
                    </div>
                    <a href="${note.link}" target="_blank" class="card-link" title="Open official release notes">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>
                <div class="card-body">
                    ${note.content_html}
                </div>
            </div>
            
            <div class="card-actions-col">
                <button class="tweet-action-btn" title="Tweet this update" data-id="${note.id}">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Setup card checkbox click
        const checkbox = card.querySelector('.note-checkbox');
        checkbox.addEventListener('change', (e) => {
            toggleSelectNote(note.id, e.target.checked);
        });
        
        // Also toggle when clicking the card body (excluding links)
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A' && e.target.closest('a') === null && 
                e.target.tagName !== 'INPUT' && e.target.closest('.custom-checkbox') === null &&
                e.target.closest('.tweet-action-btn') === null) {
                const check = card.querySelector('.note-checkbox');
                check.checked = !check.checked;
                toggleSelectNote(note.id, check.checked);
            }
        });
        
        // Individual Tweet Button
        const tweetBtn = card.querySelector('.tweet-action-btn');
        tweetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTweetComposer([note.id]);
        });
        
        notesGrid.appendChild(card);
    });
}

function getCardClassForCategory(category) {
    const cat = category.toLowerCase();
    if (cat.includes('feature')) return 'category-feature';
    if (cat.includes('change')) return 'category-change';
    if (cat.includes('deprecation') || cat.includes('disable')) return 'category-deprecation';
    return 'category-general';
}

function setEmptyState(isEmpty) {
    if (isEmpty) {
        notesGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        notesGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');
    }
}

// Select Note Toggles
function toggleSelectNote(id, isSelected) {
    const card = document.querySelector(`.note-card[data-id="${id}"]`);
    
    if (isSelected) {
        selectedNotes.add(id);
        if (card) card.classList.add('selected');
    } else {
        selectedNotes.delete(id);
        if (card) card.classList.remove('selected');
    }
    
    updateSelectionUI();
}

function updateSelectionUI() {
    const count = selectedNotes.size;
    selectedCountBadge.textContent = count;
    composeTweetBtn.disabled = count === 0;
}

// Bulk Selection Actions
selectAllBtn.addEventListener('click', () => {
    const visibleNotes = getVisibleNotes();
    visibleNotes.forEach(note => {
        selectedNotes.add(note.id);
        const card = document.querySelector(`.note-card[data-id="${note.id}"]`);
        if (card) {
            card.classList.add('selected');
            const check = card.querySelector('.note-checkbox');
            if (check) check.checked = true;
        }
    });
    updateSelectionUI();
    showToast(`Selected all ${visibleNotes.length} visible updates`);
});

clearSelectionBtn.addEventListener('click', () => {
    selectedNotes.clear();
    document.querySelectorAll('.note-card').forEach(card => {
        card.classList.remove('selected');
        const check = card.querySelector('.note-checkbox');
        if (check) check.checked = false;
    });
    updateSelectionUI();
    showToast('Selection cleared');
});

// Category Filter click handling
filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        renderNotes();
    });
});

// Search input handling
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderNotes();
});

// Refresh button handler
refreshBtn.addEventListener('click', fetchReleaseNotes);

// Toast system
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast active ${isError ? 'error' : ''}`;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// ==========================================
// Tweet Composer & Web Intent Logic
// ==========================================

composeTweetBtn.addEventListener('click', () => {
    if (selectedNotes.size > 0) {
        openTweetComposer(Array.from(selectedNotes));
    }
});

// Open Tweet Modal
function openTweetComposer(noteIds) {
    // Populate Modal list of notes in draft
    modalSelectedList.innerHTML = '';
    
    let draftText = '';
    const selectedList = [];
    
    noteIds.forEach(id => {
        const note = releaseNotes.find(n => n.id === id);
        if (note) {
            selectedList.push(note);
            
            // Build simple draft elements
            const item = document.createElement('div');
            item.className = 'selected-item-pill';
            
            const catClass = note.category.toLowerCase().includes('feature') ? 'feature' : 
                             note.category.toLowerCase().includes('change') ? 'change' : 
                             note.category.toLowerCase().includes('deprecation') ? 'deprecation' : 'general';
                             
            item.innerHTML = `
                <div class="pill-content">
                    <span class="pill-title ${catClass}">${note.category}</span>
                    <span class="pill-text">${note.content_text}</span>
                </div>
            `;
            
            modalSelectedList.appendChild(item);
        }
    });
    
    // Generate pre-populated text
    if (selectedList.length === 1) {
        const note = selectedList[0];
        // Standard template for single note
        draftText = `📢 Google BigQuery Release Update (${note.date}):\n\n🔹 ${note.category}: ${note.content_text.substring(0, 150)}...\n\nRead more: ${note.link}`;
    } else if (selectedList.length > 1) {
        // Template for multiple notes
        draftText = `💡 Google BigQuery Release Updates:\n`;
        selectedList.forEach(note => {
            draftText += `\n• [${note.date}] ${note.category}: ${note.content_text.substring(0, 50)}...`;
        });
        draftText += `\n\nDocs: https://cloud.google.com/bigquery/docs/release-notes`;
    }
    
    // Crop draftText to keep it sensible if needed
    if (draftText.length > 280) {
        draftText = draftText.substring(0, 277) + '...';
    }
    
    tweetTextarea.value = draftText;
    updateCharCounter();
    
    // Show Modal
    tweetModal.classList.add('active');
}

// Close Tweet Modal
function closeTweetComposer() {
    tweetModal.classList.remove('active');
}

closeModalBtn.addEventListener('click', closeTweetComposer);

// Close modal clicking outside
tweetModal.addEventListener('click', (e) => {
    if (e.target === tweetModal) {
        closeTweetComposer();
    }
});

// Character Counter Logic
function updateCharCounter() {
    const len = tweetTextarea.value.length;
    const remaining = 280 - len;
    
    charCountText.textContent = remaining;
    
    // Circle progress ring
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        
        // Progress percentage (cap at 100%)
        const pct = Math.min(len / 280, 1);
        const offset = circumference - (pct * circumference);
        circle.style.strokeDashoffset = offset;
        
        // Color transition based on character count
        if (remaining < 0) {
            circle.style.stroke = '#ef4444'; // Red
            charCountText.style.color = '#ef4444';
            tweetWebBtn.disabled = true;
        } else if (remaining <= 20) {
            circle.style.stroke = '#f59e0b'; // Amber
            charCountText.style.color = '#f59e0b';
            tweetWebBtn.disabled = false;
        } else {
            circle.style.stroke = '#3b82f6'; // Blue
            charCountText.style.color = '#9ca3af';
            tweetWebBtn.disabled = false;
        }
    }
}

tweetTextarea.addEventListener('input', updateCharCounter);

// Open Twitter Intent when Posting
tweetWebBtn.addEventListener('click', () => {
    const text = tweetTextarea.value;
    if (text.length > 0 && text.length <= 280) {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank');
        closeTweetComposer();
        showToast('Redirected to Twitter/X!');
    }
});

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    
    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        const moonIcon = themeToggleBtn.querySelector('.moon-icon');
        const sunIcon = themeToggleBtn.querySelector('.sun-icon');
        
        // Load preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        }
        
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            
            if (isLight) {
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
                showToast('Switched to Light Mode');
            } else {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
                showToast('Switched to Dark Mode');
            }
        });
    }
});
