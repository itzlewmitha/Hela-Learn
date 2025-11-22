// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAkZ1COLT59ukLGzpv5lW3UZ8vQ9tEN1gw",
    authDomain: "hela-code.firebaseapp.com",
    projectId: "hela-code",
    storageBucket: "hela-code.appspot.com",
    messagingSenderId: "813299203715",
    appId: "1:813299203715:web:910e7227cdd4a09ad1a5b6"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ==================== GLOBAL STATE ====================
let state = {
    currentChatId: null,
    chats: [],
    currentUser: null,
    uploadedFiles: [],
    isInitialized: false,
    firestoreEnabled: true,
    theme: localStorage.getItem('helaTheme') || 'dark',
    userProgress: {
        credits: 50,
        xp: 0,
        lastActive: null,
        monthlyCreditsClaimed: false,
        stats: {
            messagesSent: 0,
            codeQuestions: 0,
            filesUploaded: 0,
            chatsCreated: 0,
            consecutiveDays: 0
        }
    }
};

// ==================== DOM ELEMENTS ====================
let elements = {};

// ==================== UTILITY FUNCTIONS ====================
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        if (notif.parentNode) {
            notif.parentNode.removeChild(notif);
        }
    }, 3000);
}

function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    setTimeout(() => {
        if (elements.chatMessages) {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
    }, 100);
}

function autoResizeTextarea() {
    if (elements.chatInput) {
        elements.chatInput.style.height = 'auto';
        elements.chatInput.style.height = Math.min(elements.chatInput.scrollHeight, 120) + 'px';
    }
}

function generateChatId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ==================== THEME MANAGEMENT ====================
function initializeTheme() {
    applyTheme(state.theme);
    
    const appearanceBtn = document.getElementById('appearanceSettingsBtn');
    if (appearanceBtn) {
        appearanceBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('helaTheme', state.theme);
    applyTheme(state.theme);
    showNotification(`Switched to ${state.theme} theme`);
    
    const settingsMenu = document.getElementById('settingsMenu');
    if (settingsMenu) {
        settingsMenu.classList.remove('open');
    }
}

function applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'light') {
        root.style.setProperty('--primary', '#8B5FBF');
        root.style.setProperty('--primary-light', '#C9A7E8');
        root.style.setProperty('--primary-dark', '#6D3F9F');
        root.style.setProperty('--text', '#1A1A1A');
        root.style.setProperty('--text-light', '#4A4A4A');
        root.style.setProperty('--background', '#F7F5FB');
        root.style.setProperty('--card-bg', '#FFFFFF');
        root.style.setProperty('--card-hover', '#F0E9FA');
        root.style.setProperty('--shadow', '0 4px 12px rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--border', '#E0D8EF');
    } else {
        // Dark theme - ensure all variables are properly set
        root.style.setProperty('--primary', '#8B5FBF');
        root.style.setProperty('--primary-light', '#9D76C1');
        root.style.setProperty('--primary-dark', '#6D3F9F');
        root.style.setProperty('--primary-hover', '#A98ACA');
        root.style.setProperty('--text', '#FFFFFF');
        root.style.setProperty('--text-light', '#B0B0B0');
        root.style.setProperty('--background', '#121212');
        root.style.setProperty('--card-bg', '#1E1E1E');
        root.style.setProperty('--card-hover', '#252525');
        root.style.setProperty('--shadow', '0 4px 12px rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--success', '#4CAF50');
        root.style.setProperty('--warning', '#ff9800');
        root.style.setProperty('--error', '#f44336');
        root.style.setProperty('--border', '#333333');
    }
    
    // Force a repaint to ensure theme is applied
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
}
// ==================== TYPING INDICATOR FUNCTIONS ====================
function removeTypingIndicator() {
    const typing = document.getElementById('typing-indicator');
    if (typing && typing.parentNode) {
        typing.parentNode.removeChild(typing);
    }
}

function showTypingIndicator() {
    removeTypingIndicator();
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'H';
    typingDiv.appendChild(avatar);
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble ai-bubble typing-indicator';
    messageBubble.innerHTML = `
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
        <span>Hela Learn is thinking...</span>
    `;
    
    messageContent.appendChild(messageBubble);
    typingDiv.appendChild(messageContent);
    
    if (elements.chatMessages) {
        elements.chatMessages.appendChild(typingDiv);
        scrollToBottom();
    }
}

// ==================== FILE UPLOAD FUNCTIONS ====================
function setupFileUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'fileInput';
    fileInput.style.display = 'none';
    fileInput.multiple = true;
    fileInput.accept = '*/*';
    
    document.body.appendChild(fileInput);
    
    const uploadBtn = document.getElementById('fileUploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    fileInput.addEventListener('change', handleFileUpload);
}

async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files.length) return;
    
    if (!state.currentUser) {
        showNotification('Please sign in to upload files', 'error');
        return;
    }
    
    // Store files temporarily - they'll be sent with the next message
    for (let file of files) {
        await processFile(file);
    }
    
    showNotification(`Added ${files.length} file(s) to next message`, 'success');
    event.target.value = '';
}

async function processFile(file) {
    try {
        const fileId = generateFileId();
        let fileContent = '';
        let fileInfo = '';
        
        if (file.type.startsWith('text/') || 
            file.name.endsWith('.txt') || file.name.endsWith('.js') || 
            file.name.endsWith('.html') || file.name.endsWith('.css') ||
            file.name.endsWith('.json') || file.name.endsWith('.py') ||
            file.name.endsWith('.java') || file.name.endsWith('.cpp')) {
            
            fileContent = await readFileAsText(file);
            fileInfo = `File Content:\n${fileContent}`;
            
        } else if (file.type.startsWith('image/')) {
            const imageInfo = await getImageInfo(file);
            fileInfo = `Image Analysis:\n- Dimensions: ${imageInfo.width}x${imageInfo.height}\n- File Size: ${(file.size / 1024).toFixed(2)} KB\n- Type: ${file.type}`;
            
        } else {
            fileInfo = `File Analysis:\n- File Name: ${file.name}\n- File Type: ${file.type || 'Unknown'}\n- File Size: ${(file.size / 1024).toFixed(2)} KB`;
        }
        
        const fileData = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: fileContent,
            info: fileInfo,
            uploadedAt: new Date().toISOString()
        };
        
        state.uploadedFiles.push(fileData);
        state.userProgress.stats.filesUploaded++;
        
        // Show file preview in chat input area
        showFilePreview(fileData);
        
    } catch (error) {
        console.error('File processing error:', error);
        showNotification(`Failed to process file: ${error.message}`, 'error');
    }
}

function showFilePreview(fileData) {
    // Create file preview in chat input area
    const filePreview = document.createElement('div');
    filePreview.className = 'file-preview';
    filePreview.innerHTML = `
        <div class="file-icon">
            <i class="fas fa-file"></i>
        </div>
        <div class="file-info">
            <div class="file-name">${fileData.name}</div>
            <div class="file-size">${(fileData.size / 1024).toFixed(2)} KB</div>
        </div>
        <button class="remove-file-btn" data-fileid="${fileData.id}">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to a container above chat input
    let filesContainer = document.getElementById('filesContainer');
    if (!filesContainer) {
        filesContainer = document.createElement('div');
        filesContainer.id = 'filesContainer';
        filesContainer.className = 'files-container';
        const chatInputContainer = document.querySelector('.chat-input-container');
        chatInputContainer.insertBefore(filesContainer, chatInputContainer.querySelector('.chat-input-wrapper'));
    }
    
    filesContainer.appendChild(filePreview);
    
    // Add remove file functionality
    const removeBtn = filePreview.querySelector('.remove-file-btn');
    removeBtn.addEventListener('click', () => {
        removeFile(fileData.id);
        filePreview.remove();
    });
}

function removeFile(fileId) {
    state.uploadedFiles = state.uploadedFiles.filter(file => file.id !== fileId);
    if (state.uploadedFiles.length === 0) {
        const filesContainer = document.getElementById('filesContainer');
        if (filesContainer) {
            filesContainer.remove();
        }
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function getImageInfo(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = function() {
            resolve({
                width: this.width,
                height: this.height
            });
            URL.revokeObjectURL(url);
        };
        
        img.onerror = function() {
            reject(new Error('Failed to load image'));
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    });
}
// ==================== NOTE GENERATOR SYSTEM ====================
function setupNoteGenerator() {
    const noteGeneratorBtn = document.getElementById('noteGeneratorBtn');
    const noteGeneratorModal = document.getElementById('noteGeneratorModal');
    const closeNoteGeneratorModal = document.getElementById('closeNoteGeneratorModal');
    const cancelNoteBtn = document.getElementById('cancelNoteBtn');
    const generateNoteBtn = document.getElementById('generateNoteBtn');

    if (noteGeneratorBtn) {
        noteGeneratorBtn.addEventListener('click', () => {
            noteGeneratorModal.style.display = 'flex';
        });
    }

    if (closeNoteGeneratorModal) {
        closeNoteGeneratorModal.addEventListener('click', () => {
            noteGeneratorModal.style.display = 'none';
        });
    }

    if (cancelNoteBtn) {
        cancelNoteBtn.addEventListener('click', () => {
            noteGeneratorModal.style.display = 'none';
        });
    }

    if (generateNoteBtn) {
        generateNoteBtn.addEventListener('click', generateStudyNotes);
    }

    // Close modal when clicking outside
    if (noteGeneratorModal) {
        noteGeneratorModal.addEventListener('click', (e) => {
            if (e.target === noteGeneratorModal) {
                noteGeneratorModal.style.display = 'none';
            }
        });
    }
}

async function generateStudyNotes() {
    try {
        const subject = document.getElementById('noteSubject').value;
        const grade = document.getElementById('noteGrade').value;
        const topic = document.getElementById('noteTopic').value;
        const noteType = document.getElementById('noteType').value;
        const instructions = document.getElementById('noteInstructions').value;

        if (!subject || !grade || !topic) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Check credits
        if (!await useCredits(3, 'note_generation')) {
            return;
        }

        const generateBtn = document.getElementById('generateNoteBtn');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;

        // Create the prompt for AI
        const notePrompt = createNotePrompt(subject, grade, topic, noteType, instructions);
        
        // Show typing indicator
        showTypingIndicator();

        // Call AI to generate notes
        const notesContent = await callAI(notePrompt);
        removeTypingIndicator();

        // Display notes in chat
        displayNotesInChat(notesContent, subject, grade, topic);
        
        // Generate and download PDF
        await generatePDF(notesContent, subject, grade, topic);
        
        // Close modal
        document.getElementById('noteGeneratorModal').style.display = 'none';
        
        // Reset form
        document.getElementById('noteGeneratorForm').reset();

        showNotification('Study notes generated and downloaded!', 'success');

    } catch (error) {
        console.error('Error generating notes:', error);
        showNotification('Error generating notes. Please try again.', 'error');
    } finally {
        const generateBtn = document.getElementById('generateNoteBtn');
        if (generateBtn) {
            generateBtn.innerHTML = '<i class="fas fa-download"></i> Generate & Download PDF';
            generateBtn.disabled = false;
        }
    }
}

function createNotePrompt(subject, grade, topic, noteType, instructions) {
    const noteTypeMap = {
        'short_notes': 'concise short notes with bullet points',
        'summary': 'comprehensive summary',
        'revision': 'exam-focused revision notes',
        'detailed': 'detailed study notes',
        'mindmap': 'structured mind map format'
    };

    let prompt = `Create ${noteTypeMap[noteType] || 'study notes'} for the following request:

SUBJECT: ${subject}
GRADE: ${grade}
TOPIC: ${topic}

Please structure the notes with:
1. Clear headings and subheadings
2. Bullet points for easy reading
3. Key definitions highlighted
4. Important dates/events (if applicable)
5. Summary section
6. Space for student's own notes

${instructions ? `ADDITIONAL INSTRUCTIONS: ${instructions}` : ''}

Format the response in a way that's easy to convert to a PDF study guide. Use clear section breaks and emphasize important concepts.`;

    return prompt;
}

function displayNotesInChat(notesContent, subject, grade, topic) {
    if (!elements.chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'H';
    messageDiv.appendChild(avatar);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble ai-bubble';

    // Create notes preview
    const notesPreview = document.createElement('div');
    notesPreview.className = 'note-preview';
    
    notesPreview.innerHTML = `
        <div class="note-preview-header">
            <div class="note-preview-title">📚 Study Notes: ${topic}</div>
        </div>
        <div class="note-preview-content">
            <div style="margin-bottom: 12px;">
                <strong>Subject:</strong> ${subject} | 
                <strong>Grade:</strong> ${grade} |
                <strong>Type:</strong> Study Notes
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; font-size: 0.9rem;">
                ${formatAIResponse(notesContent)}
            </div>
        </div>
        <button class="pdf-download-btn" onclick="regeneratePDF('${subject}', '${grade}', '${topic}')">
            <i class="fas fa-redo"></i> Regenerate PDF
        </button>
    `;

    messageBubble.appendChild(notesPreview);
    messageContent.appendChild(messageBubble);
    messageDiv.appendChild(messageContent);
    elements.chatMessages.appendChild(messageDiv);

    // Add to chat history
    addMessageToChat('ai', `Generated study notes for: ${topic} (${subject} - Grade ${grade})`);

    scrollToBottom();
}

async function generatePDF(notesContent, subject, grade, topic) {
    try {
        // Create a temporary div to hold formatted content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formatAIResponse(notesContent);
        
        // Get clean text for PDF
        const cleanContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // Create PDF content
        const pdfContent = createPDFContent(cleanContent, subject, grade, topic);
        
        // Create and download PDF
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HelaLearn_Notes_${subject}_Grade${grade}_${topic.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        // Fallback: offer text download
        downloadTextFile(notesContent, subject, grade, topic);
    }
}

function createPDFContent(content, subject, grade, topic) {
    // Simple PDF content structure
    // In a real implementation, you'd use a PDF library like jsPDF
    const pdfStructure = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj

4 0 obj
<< /Length 100 >>
stream
BT
/F1 12 Tf
50 750 Td
(Hela Learn - Study Notes) Tj
0 -20 Td
(Subject: ${subject}) Tj
0 -20 Td
(Grade: ${grade}) Tj
0 -20 Td
(Topic: ${topic}) Tj
0 -40 Td
(${content.substring(0, 500)}...) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000190 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${content.length}
%%EOF
`;

    return pdfStructure;
}

function downloadTextFile(content, subject, grade, topic) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HelaLearn_Notes_${subject}_Grade${grade}_${topic.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function regeneratePDF(subject, grade, topic) {
    if (!await useCredits(1, 'pdf_regeneration')) {
        return;
    }
    
    // Get the last notes content from chat (you might want to store this in state)
    const notePrompt = `Regenerate the PDF for: ${subject}, Grade ${grade}, Topic: ${topic}`;
    showNotification('Regenerating PDF...', 'success');
    
    // You can store the last generated notes in state for regeneration
    // For now, we'll just create a simple PDF
    const content = `Regenerated notes for ${topic} (${subject} - Grade ${grade})`;
    await generatePDF(content, subject, grade, topic);
}

// Add credit cost for note generation
const CREDIT_COSTS = {
    CHAT_MESSAGE: 1,
    NEW_CHAT: 0,
    FILE_ANALYSIS: 2,
    NOTE_GENERATION: 3,  // Add this
    PDF_REGENERATION: 1   // Add this
};

// Update the initialize function to include note generator setup
async function startApplication() {
    try {
        console.log('Starting Hela Learn application...');
        
        const elementsReady = await initializeElements();
        if (!elementsReady) throw new Error('Failed to initialize DOM elements');
        
        setupEventListeners();
        setupChallengesModal();
        setupFileUpload();
        setupNoteGenerator();  // Add this line
        initializeTheme();
        await initializeApp();
        
        showNotification('Hela Learn loaded successfully!');
        
    } catch (error) {
        console.error('Failed to start application:', error);
        showNotification('Failed to load app. Please refresh the page.', 'error');
    }
}

// ==================== CODE BLOCK FUNCTIONS ====================
function copyToClipboard(button) {
    const codeBlock = button.closest('.code-block');
    const codeElement = codeBlock.querySelector('code');
    const codeText = codeElement.textContent;
    
    navigator.clipboard.writeText(codeText).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = 'var(--success)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code:', err);
        button.textContent = 'Failed';
        button.style.background = 'var(--error)';
    });
}

function downloadCode(button) {
    const codeBlock = button.closest('.code-block');
    const codeElement = codeBlock.querySelector('code');
    const language = codeBlock.querySelector('.code-header span').textContent;
    const codeText = codeElement.textContent;
    
    const blob = new Blob([codeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Code downloaded successfully!', 'success');
}

function getFileExtension(language) {
    const extensions = {
        'javascript': 'js', 'python': 'py', 'html': 'html', 'css': 'css',
        'java': 'java', 'php': 'php', 'sql': 'sql', 'json': 'json',
        'bash': 'sh', 'text': 'txt'
    };
    return extensions[language.toLowerCase()] || 'txt';
}

function addCodeBlockListeners() {
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
        btn.onclick = function() { copyToClipboard(this); };
    });
    
    document.querySelectorAll('.download-code-btn').forEach(btn => {
        btn.onclick = function() { downloadCode(this); };
    });
}

// ==================== CODE DETECTION FUNCTION ====================
function formatAIResponse(content) {
    if (!content) return '';
    
    const parts = content.split(/(```[\s\S]*?```)/g);
    let formattedContent = '';
    
    parts.forEach(part => {
        if (part.startsWith('```') && part.endsWith('```')) {
            const codeContent = part.slice(3, -3).trim();
            const firstNewline = codeContent.indexOf('\n');
            
            let language = 'text';
            let code = codeContent;
            
            if (firstNewline !== -1) {
                const potentialLang = codeContent.substring(0, firstNewline).trim();
                if (/^[a-zA-Z0-9+#-]+$/.test(potentialLang)) {
                    language = potentialLang;
                    code = codeContent.substring(firstNewline + 1);
                }
            }
            
            formattedContent += `
                <div class="code-block">
                    <div class="code-header">
                        <span>${language}</span>
                        <div class="code-actions">
                            <button class="copy-code-btn">Copy</button>
                            <button class="download-code-btn">Download</button>
                        </div>
                    </div>
                    <pre><code class="language-${language}">${escapeHTML(code)}</code></pre>
                </div>
            `;
        } else {
            formattedContent += part
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        }
    });
    
    return formattedContent;
}

// ==================== CREDIT SYSTEM ====================
const CREDIT_COSTS = {
    CHAT_MESSAGE: 1,
    NEW_CHAT: 0, // Free now
    FILE_ANALYSIS: 2
};

async function useCredits(cost, action) {
    if (!state.currentUser) return true;
    
    if (state.userProgress.credits >= cost) {
        state.userProgress.credits -= cost;
        updateProgressUI();
        
        if (action === 'chat_message') {
            state.userProgress.stats.messagesSent++;
        } else if (action === 'file_analysis') {
            state.userProgress.stats.filesUploaded++;
        }
        
        
        if (state.firestoreEnabled) {
            await saveUserProgress();
        } else {
            saveUserProgressToLocalStorage();
        }
        
        return true;
    } else {
        showNotification(`Not enough credits! You need ${cost} credits for this action.`, 'error');
        return false;
    }
}



// ==================== FIREBASE OPERATIONS ====================
async function saveChatToFirestore(chat) {
    try {
        if (!state.currentUser || !state.firestoreEnabled) return false;
        
        await db.collection('users')
            .doc(state.currentUser.uid)
            .collection('chats')
            .doc(chat.id)
            .set({
                title: chat.title,
                messages: chat.messages,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        return true;
    } catch (error) {
        console.error('Firestore save error:', error);
        if (error.code === 'permission-denied') {
            state.firestoreEnabled = false;
            showNotification('Firestore permissions issue. Using local storage only.', 'error');
        }
        saveChatsToLocalStorage();
        return false;
    }
}

async function deleteChatFromFirestore(chatId) {
    try {
        if (!state.currentUser || !state.firestoreEnabled) return false;
        await db.collection('users')
            .doc(state.currentUser.uid)
            .collection('chats')
            .doc(chatId)
            .delete();
        return true;
    } catch (error) {
        console.error('Firestore delete error:', error);
        if (error.code === 'permission-denied') {
            state.firestoreEnabled = false;
        }
        return false;
    }
}

async function loadChatsFromFirestore() {
    try {
        if (!state.currentUser || !state.firestoreEnabled) return false;
        
        const snapshot = await db.collection('users')
            .doc(state.currentUser.uid)
            .collection('chats')
            .orderBy('updatedAt', 'desc')
            .get();

        if (snapshot.empty) {
            state.chats = [];
            return true;
        }

        state.chats = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || 'New Chat',
                messages: data.messages || [],
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
            };
        });
        
        return true;
    } catch (error) {
        console.error('Firestore load error:', error);
        if (error.code === 'permission-denied') {
            state.firestoreEnabled = false;
            showNotification('Firestore permissions issue. Using local storage.', 'error');
        }
        return false;
    }
}

async function saveUserProgress() {
    try {
        if (!state.currentUser || !state.firestoreEnabled) return;
        await db.collection('users').doc(state.currentUser.uid).set({
            progress: state.userProgress,
            lastActive: new Date()
        }, { merge: true });
    } catch (error) {
        console.error('Error saving user progress:', error);
        if (error.code === 'permission-denied') {
            state.firestoreEnabled = false;
        }
        saveUserProgressToLocalStorage();
    }
}

function saveUserProgressToLocalStorage() {
    try {
        if (!state.currentUser) return;
        localStorage.setItem(`helaProgress_${state.currentUser.uid}`, JSON.stringify(state.userProgress));
    } catch (error) {
        console.error('Local storage save error:', error);
    }
}

function loadUserProgressFromLocalStorage() {
    try {
        if (!state.currentUser) return false;
        const saved = localStorage.getItem(`helaProgress_${state.currentUser.uid}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            state.userProgress = { ...state.userProgress, ...parsed };
            return true;
        }
        return false;
    } catch (error) {
        console.error('Local storage load error:', error);
        return false;
    }
}

function saveChatsToLocalStorage() {
    try {
        if (!state.currentUser) return;
        localStorage.setItem(`helaChats_${state.currentUser.uid}`, JSON.stringify(state.chats));
    } catch (error) {
        console.error('Local storage save error:', error);
    }
}

function loadChatsFromLocalStorage() {
    try {
        if (!state.currentUser) return false;
        const saved = localStorage.getItem(`helaChats_${state.currentUser.uid}`);
        if (saved) {
            state.chats = JSON.parse(saved);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Local storage load error:', error);
        return false;
    }
}

// ==================== CHAT MANAGEMENT ====================
async function createNewChat() {
    try {
        if (!await useCredits(CREDIT_COSTS.NEW_CHAT, 'new_chat')) {
            return null;
        }

        const newChat = {
            id: generateChatId(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        state.chats.unshift(newChat);
        state.currentChatId = newChat.id;
        
        state.userProgress.stats.chatsCreated++;
        
        await saveChatToFirestore(newChat);
        saveChatsToLocalStorage();
        
        if (elements.chatMessages) elements.chatMessages.innerHTML = '';
        if (elements.welcomeScreen) elements.welcomeScreen.style.display = 'flex';
        
        updateChatHistorySidebar();
        updateURL(newChat.id);
        
        
        return newChat.id;
    } catch (error) {
        console.error('Error creating new chat:', error);
        showNotification('Error creating chat', 'error');
        return null;
    }
}

function updateChatHistorySidebar() {
    if (!elements.chatHistory) return;
    
    elements.chatHistory.innerHTML = '';
    
    if (state.chats.length === 0) {
        elements.chatHistory.innerHTML = '<div class="no-chats">No conversations yet</div>';
        return;
    }
    
    state.chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === state.currentChatId ? 'active' : ''}`;
        chatItem.innerHTML = `
            <span class="chat-item-icon">💬</span>
            <span class="chat-item-title">${escapeHTML(chat.title)}</span>
            <div class="chat-actions">
                <button class="share-chat" data-chatid="${chat.id}" title="Share chat">
                    <i class="fas fa-share"></i>
                </button>
                <button class="delete-chat" data-chatid="${chat.id}" title="Delete chat">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        chatItem.addEventListener('click', function(e) {
            if (!e.target.closest('.chat-actions')) {
                loadChat(chat.id);
            }
        });
        
        elements.chatHistory.appendChild(chatItem);
    });
}

async function deleteChat(chatId, event) {
    if (event) event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) {
        return;
    }
    
    state.chats = state.chats.filter(chat => chat.id !== chatId);
    
    await deleteChatFromFirestore(chatId);
    saveChatsToLocalStorage();
    
    if (state.currentChatId === chatId) {
        if (state.chats.length > 0) {
            state.currentChatId = state.chats[0].id;
            await loadChat(state.currentChatId);
        } else {
            await createNewChat();
        }
    }
    
    updateChatHistorySidebar();
    showNotification('Chat deleted');
}

async function loadChat(chatId) {
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) {
        showNotification('Chat not found', 'error');
        return false;
    }
    
    state.currentChatId = chatId;
    updateURL(chatId);
    
    if (elements.chatMessages) elements.chatMessages.innerHTML = '';
    
    if (elements.welcomeScreen) {
        elements.welcomeScreen.style.display = chat.messages.length > 0 ? 'none' : 'flex';
    }
    
    if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach(msg => {
            if (msg.type === 'user') {
                addMessageToUI('user', msg.content);
            } else {
                displayAIResponse(msg.content);
            }
        });
    }
    
    updateChatHistorySidebar();
    scrollToBottom();
    return true;
}

async function addMessageToChat(sender, content) {
    try {
        if (!state.currentChatId) return;
        
        const chat = state.chats.find(c => c.id === state.currentChatId);
        if (!chat) return;
        
        chat.messages.push({
            type: sender,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        chat.updatedAt = new Date().toISOString();
        
        if (sender === 'user' && chat.messages.length === 1) {
            chat.title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        }
        
        await saveChatToFirestore(chat);
        saveChatsToLocalStorage();
        updateChatHistorySidebar();
    } catch (error) {
        console.error('Error adding message to chat:', error);
    }
}

// ==================== URL ROUTING ====================
function getChatIdFromURL() {
    try {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#chat_')) {
            return hash.substring(1);
        }
        return null;
    } catch (error) {
        return null;
    }
}

function updateURL(chatId) {
    try {
        if (!chatId) return;
        window.history.replaceState(null, null, `#${chatId}`);
    } catch (error) {
        console.error('Error updating URL:', error);
    }
}

function shareChat(chatId) {
    try {
        const shareUrl = `${window.location.origin}${window.location.pathname}#${chatId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Hela Learn Chat',
                text: 'Check out this learning conversation!',
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showNotification('Chat link copied to clipboard!', 'success');
            });
        }
    } catch (error) {
        console.error('Error sharing chat:', error);
    }
}

// ==================== UI MESSAGE FUNCTIONS ====================
function addMessageToUI(sender, text) {
    if (!elements.chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (sender === 'ai') {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'H';
        messageDiv.appendChild(avatar);
    }
    
    const messageBubble = document.createElement('div');
    messageBubble.className = `message-bubble ${sender === 'ai' ? 'ai-bubble' : ''}`;
    messageBubble.textContent = text;
    
    messageContent.appendChild(messageBubble);
    messageDiv.appendChild(messageContent);
    
    if (sender === 'user') {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'U';
        avatar.style.background = '#666';
        messageDiv.appendChild(avatar);
    }
    
    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function displayAIResponse(content) {
    if (!elements.chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'H';
    messageDiv.appendChild(avatar);
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble ai-bubble';
    messageBubble.innerHTML = formatAIResponse(content);
    
    messageContent.appendChild(messageBubble);
    messageDiv.appendChild(messageContent);
    elements.chatMessages.appendChild(messageDiv);
    
    addCodeBlockListeners();
    scrollToBottom();
}

// ==================== AI API WITH CONVERSATION MEMORY ====================
const API_CONFIG = {
    URL: 'https://endpoint.apilageai.lk/api/chat',
    KEY: 'apk_QngciclzfHi2yAfP3WvZgx68VbbONQTP',
    MODEL: 'FREE'
};

async function callAI(userMessage, attachedFiles = []) {
    try {
        // Get conversation history for context
        const currentChat = state.chats.find(chat => chat.id === state.currentChatId);
        let conversationHistory = '';
        
        if (currentChat && currentChat.messages.length > 0) {
            // Include recent messages for context (last 8 messages for better memory)
            const recentMessages = currentChat.messages.slice(-8);
            conversationHistory = recentMessages.map(msg => 
                `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n');
        }

        // Build the prompt with files if any
        let fullPrompt = conversationHistory ? 
            `Previous conversation:\n${conversationHistory}\n\n` : '';

        // Add file information if files are attached
        if (attachedFiles.length > 0) {
            fullPrompt += "I'm sending you the following files:\n";
            attachedFiles.forEach(file => {
                fullPrompt += `\n--- File: ${file.name} ---\n`;
                fullPrompt += file.info + '\n';
            });
            fullPrompt += `\nUser: ${userMessage}`;
        } else {
            fullPrompt += `User: ${userMessage}`;
        }

        const response = await fetch(API_CONFIG.URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_CONFIG.KEY}`
            },
            body: JSON.stringify({
                system: `You are Hela Learn, Sri Lanka's premier AI learning assistant. Your role is to help students with studying, note-taking, and academic success.

SPECIALIZATIONS:
- Study Note Generation (all subjects)
- Exam Preparation
- Concept Explanation
- Homework Help
- Research Assistance

NOTE GENERATION GUIDELINES:
- Structure notes with clear headings and subheadings
- Use bullet points for easy scanning
- Highlight key definitions and important concepts
- Include timelines for historical topics
- Add diagrams/flowcharts for science topics
- Provide summaries at the end
- Leave space for student's own notes
- Use appropriate language for the grade level

RESPONSE FORMAT FOR NOTES:
1. MAIN TOPIC TITLE
   - Key point 1
   - Key point 2
   - Important definitions

2. SUBTOPIC
   - Detailed points
   - Examples
   - Related concepts

KEY FEATURES:
- Include "Key Terms" section with definitions
- Add "Important Dates" for historical topics
- Create "Summary" section at the end
- Suggest "Study Tips" when relevant

TONE: Educational, supportive, and clear. Adapt to the student's grade level and stay always in the topic`,
                message: fullPrompt,
                model: API_CONFIG.MODEL,
                enableGoogleSearch: false
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const result = await response.json();
        console.log('API Response:', result);

        if (result.success && result.response) {
            return result.response;
        } else {
            throw new Error('Invalid API response');
        }

    } catch (error) {
        console.error('AI API Error:', error);
        return "I'm currently experiencing connection issues. Please try again in a moment.";
    }
}

// ==================== USER MANAGEMENT ====================
function updateUserInfo(user) {
    try {
        if (elements.userName) {
            elements.userName.textContent = user.displayName || user.email || 'User';
        }
        
        if (elements.userAvatar) {
            const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
            elements.userAvatar.innerHTML = user.photoURL ? '' : initial;
            if (user.photoURL) {
                elements.userAvatar.style.backgroundImage = `url(${user.photoURL})`;
            }
        }
    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

async function loadUserProgress(userId) {
    try {
        if (state.firestoreEnabled) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().progress) {
                const savedProgress = userDoc.data().progress;
                state.userProgress = { 
                    ...state.userProgress, 
                    ...savedProgress,
                    monthlyCreditsClaimed: checkMonthlyCreditsReset(savedProgress.lastActive)
                };
            }
        } else {
            loadUserProgressFromLocalStorage();
        }
        
        updateProgressUI();
    } catch (error) {
        console.error('Error loading user progress:', error);
        loadUserProgressFromLocalStorage();
        updateProgressUI();
    }
}

function checkMonthlyCreditsReset(lastActive) {
    if (!lastActive) return false;
    
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    
    return now.getMonth() === lastActiveDate.getMonth() && 
           now.getFullYear() === lastActiveDate.getFullYear();
}

function updateProgressUI() {
    try {
        if (elements.creditsDisplay) {
            elements.creditsDisplay.textContent = state.userProgress.credits;
        }
        
        const userLevel = document.getElementById('userLevel');
        if (userLevel) userLevel.textContent = state.userProgress.level;
        
        if (elements.creditBar) {
            elements.creditBar.classList.toggle('low', state.userProgress.credits < 10);
        }
    } catch (error) {
        console.error('Error updating progress UI:', error);
    }
}

// ==================== ACCOUNT DELETION ====================
async function deleteUserAccount() {
    try {
        if (!state.currentUser) {
            showNotification('No user logged in', 'error');
            return;
        }

        // Delete all user data from Firestore
        if (state.firestoreEnabled) {
            // Delete chats
            const chatsSnapshot = await db.collection('users')
                .doc(state.currentUser.uid)
                .collection('chats')
                .get();
            
            const chatDeletePromises = chatsSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(chatDeletePromises);
            
            // Delete files metadata
            const filesSnapshot = await db.collection('users')
                .doc(state.currentUser.uid)
                .collection('files')
                .get();
            
            const fileDeletePromises = filesSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(fileDeletePromises);
            
            // Delete user progress
            await db.collection('users').doc(state.currentUser.uid).delete();
        }
        
        // Delete local storage data
        localStorage.removeItem(`helaChats_${state.currentUser.uid}`);
        localStorage.removeItem(`helaProgress_${state.currentUser.uid}`);
        localStorage.removeItem('helaTheme');
        
        // Delete user authentication
        await state.currentUser.delete();
        
        showNotification('Account deleted successfully', 'success');
        setTimeout(() => {
            window.location.href = 'https://helacode.vercel.app/index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Error deleting account. Please try again.', 'error');
    }
}

// ==================== SETTINGS MENU ====================
function setupSettingsMenu() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    
    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsMenu.classList.toggle('open');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsMenu.contains(e.target)) {
                settingsMenu.classList.remove('open');
            }
        });
    }
}

// ==================== MAIN CHAT HANDLER ====================
async function handleSend() {
    try {
        const text = elements.chatInput?.value.trim() || '';
        const hasFiles = state.uploadedFiles.length > 0;
        
        if (!text && !hasFiles) {
            showNotification('Please enter a message or upload files', 'error');
            return;
        }
        
        // Check if we have a current chat, if not create one
        if (!state.currentChatId || state.chats.length === 0) {
            const newChatId = await createNewChat();
            if (!newChatId) return;
        }
        
        if (!await useCredits(CREDIT_COSTS.CHAT_MESSAGE, 'chat_message')) return;
        
        if (elements.sendBtn) {
            elements.sendBtn.disabled = true;
            elements.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        // Clear files container
        const filesContainer = document.getElementById('filesContainer');
        if (filesContainer) {
            filesContainer.remove();
        }
        
        if (elements.chatInput) {
            elements.chatInput.value = '';
            autoResizeTextarea();
        }
        
        if (elements.welcomeScreen) elements.welcomeScreen.style.display = 'none';

        // Create user message with file previews
        let userMessageContent = text;
        if (hasFiles) {
            userMessageContent += `\n\n📎 Attached ${state.uploadedFiles.length} file(s): ${state.uploadedFiles.map(f => f.name).join(', ')}`;
        }
        
        addMessageToUI('user', userMessageContent);
        await addMessageToChat('user', userMessageContent);

        showTypingIndicator();
        
        try {
            // Send message with attached files
            const reply = await callAI(text, state.uploadedFiles);
            removeTypingIndicator();
            displayAIResponse(reply);
            await addMessageToChat('ai', reply);
            
            // Clear uploaded files after sending
            state.uploadedFiles = [];
            
        } catch (error) {
            removeTypingIndicator();
            const errorMessage = "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
            displayAIResponse(errorMessage);
            await addMessageToChat('ai', errorMessage);
        }
    } catch (error) {
        console.error('Error in handleSend:', error);
        showNotification('Error sending message', 'error');
    } finally {
        if (elements.sendBtn) {
            elements.sendBtn.disabled = false;
            elements.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }
}

// ==================== INITIALIZATION ====================
async function initializeElements() {
    try {
        elements = {
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            welcomeScreen: document.getElementById('welcomeScreen'),
            newChatBtn: document.getElementById('newChatBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            chatHistory: document.getElementById('chatHistory'),
            userAvatar: document.getElementById('userAvatar'),
            userName: document.getElementById('userName'),
            examplePrompts: document.getElementById('examplePrompts'),
            creditsDisplay: document.getElementById('creditsDisplay'),
            creditBar: document.getElementById('creditBar'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsMenu: document.getElementById('settingsMenu'),
            appearanceSettingsBtn: document.getElementById('appearanceSettingsBtn'),
            deleteAccountBtn: document.getElementById('deleteAccountBtn'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
            cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
            closeDeleteAccountModal: document.getElementById('closeDeleteAccountModal'),
            fileUploadBtn: document.getElementById('fileUploadBtn')
        };
        return true;
    } catch (error) {
        console.error('Failed to initialize DOM elements:', error);
        return false;
    }
}

function setupEventListeners() {
    if (elements.sendBtn) elements.sendBtn.addEventListener('click', handleSend);

    if (elements.chatInput) {
        elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
        elements.chatInput.addEventListener('input', autoResizeTextarea);
    }

    if (elements.newChatBtn) elements.newChatBtn.addEventListener('click', createNewChat);

    // Settings menu
    setupSettingsMenu();

    // Account deletion listeners
    if (elements.deleteAccountBtn) {
        elements.deleteAccountBtn.addEventListener('click', () => {
            document.getElementById('deleteAccountModal').style.display = 'flex';
            if (elements.settingsMenu) {
                elements.settingsMenu.classList.remove('open');
            }
        });
    }

    if (elements.confirmDeleteBtn) {
        elements.confirmDeleteBtn.addEventListener('click', deleteUserAccount);
    }

    if (elements.cancelDeleteBtn) {
        elements.cancelDeleteBtn.addEventListener('click', () => {
            document.getElementById('deleteAccountModal').style.display = 'none';
        });
    }

    if (elements.closeDeleteAccountModal) {
        elements.closeDeleteAccountModal.addEventListener('click', () => {
            document.getElementById('deleteAccountModal').style.display = 'none';
        });
    }

    // Example prompt buttons
    document.querySelectorAll('.example-prompt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.getAttribute('data-prompt');
            if (elements.chatInput) {
                elements.chatInput.value = prompt;
                elements.chatInput.focus();
                autoResizeTextarea();
            }
        });
    });

    window.addEventListener('hashchange', () => {
        const chatId = getChatIdFromURL();
        if (chatId && state.chats.some(chat => chat.id === chatId)) {
            loadChat(chatId);
        }
    });

    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => window.location.href = 'https://helacode.vercel.app/index.html');
        });
    }

    // Event delegation for dynamic buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-chat')) {
            const chatId = e.target.closest('.delete-chat').dataset.chatid;
            deleteChat(chatId, e);
        }
        if (e.target.closest('.share-chat')) {
            const chatId = e.target.closest('.share-chat').dataset.chatid;
            shareChat(chatId);
        }
    });
}

// ==================== AUTHENTICATION CHECK ====================
function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                state.currentUser = user;
                resolve(user);
            } else {
                // Redirect to auth page if not logged in
                window.location.href = '/auth/';
                reject(new Error('Not authenticated'));
            }
        });
    });
}

// ==================== APP INITIALIZATION ====================
async function initializeApp() {
    try {
        // First check authentication
        await checkAuth();
        
        // Then proceed with app initialization
        updateUserInfo(state.currentUser);
        
        await Promise.all([
            loadUserProgress(state.currentUser.uid),
            loadChatsFromFirestore().then(success => {
                if (!success) loadChatsFromLocalStorage();
            })
        ]);
        
        // Handle URL routing
        const urlChatId = getChatIdFromURL();
        let chatToLoad = null;
        
        if (urlChatId) {
            const urlChat = state.chats.find(chat => chat.id === urlChatId);
            chatToLoad = urlChat ? urlChatId : (await createNewChat());
        } else if (state.chats.length > 0) {
            chatToLoad = state.chats[0].id;
        } else {
            chatToLoad = await createNewChat();
        }
        
        if (chatToLoad) await loadChat(chatToLoad);
        
        state.isInitialized = true;
        console.log('App initialized successfully');
        
    } catch (error) {
        console.error('Error in app initialization:', error);
        // Already redirected to auth page by checkAuth()
    }
}
// ==================== START APPLICATION ====================
async function startApplication() {
    try {
        const elementsReady = await initializeElements();
        if (!elementsReady) throw new Error('Failed to initialize DOM elements');
        
        setupEventListeners();
        setupFileUpload();
        initializeTheme();
        await initializeApp();
        
        showNotification('Hela Learn loaded successfully!');
    } catch (error) {
        console.error('Failed to start application:', error);
        showNotification('Failed to load app. Please refresh the page.', 'error');
    }
}

// ==================== GLOBAL FUNCTIONS ====================
window.handleSend = handleSend;
window.deleteChat = deleteChat;
window.shareChat = shareChat;
window.copyToClipboard = copyToClipboard;
window.downloadCode = downloadCode;
window.deleteUserAccount = deleteUserAccount;

// Start the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplication);
} else {
    startApplication();
}
