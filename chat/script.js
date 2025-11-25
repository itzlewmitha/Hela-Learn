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

// ==================== CREDIT COSTS ====================
const CREDIT_COSTS = {
    CHAT_MESSAGE: 1,
    NEW_CHAT: 0,
    FILE_ANALYSIS: 2,
    NOTE_GENERATION: 3,
    PDF_REGENERATION: 1
};

// ==================== SRI LANKAN CURRICULUM DATA ====================
const SRI_LANKAN_CURRICULUM = {
    // Grades 6-9 Common Subjects
    '6-9': {
        name: 'Grades 6-9',
        subjects: [
            'Mathematics', 'Science', 'English', 'Sinhala', 'Tamil', 'History', 
            'Geography', 'Civics', 'Buddhism', 'Catholicism', 'Islam', 'Health',
            'Art', 'Drama', 'Eastern Music', 'Western Music', 'ICT'
        ]
    },
    
    // O/L Subjects (Grades 10-11)
    '10-11': {
        name: 'O/L (Grades 10-11)',
        compulsory: [
            'Mathematics', 'Science', 'English', 'Sinhala', 'Tamil', 'History',
            'Buddhism', 'Catholicism', 'Islam'
        ],
        basket1: [
            'Eastern Music', 'Western Music', 'Art', 'Eastern Dancing', 
            'Western Dancing', 'Drama & Theatre'
        ],
        basket2: [
            'ICT', 'Agriculture & Food Technology', 'Home Science', 
            'Practical Technology', 'Design & Construction'
        ],
        basket3: [
            'Business & Accounting Studies', 'Geography', 'Civic Education',
            'Entrepreneurship Studies'
        ]
    },
    
    // A/L Science Stream
    'science': {
        name: 'A/L Science Stream',
        subjects: [
            'Biology', 'Chemistry', 'Physics', 'Combined Mathematics',
            'Agriculture', 'ICT'
        ]
    },
    
    // A/L Commerce Stream
    'commerce': {
        name: 'A/L Commerce Stream',
        subjects: [
            'Accounting', 'Business Studies', 'Economics', 
            'Business Statistics', 'ICT'
        ]
    },
    
    // A/L Arts Stream
    'arts': {
        name: 'A/L Arts Stream',
        subjects: [
            'Sinhala', 'Tamil', 'English', 'Political Science', 'Geography',
            'History', 'Economics', 'Buddhism', 'Christianity', 'Islam',
            'Hindu Civilization', 'Logic', 'Mass Media', 'Art', 'Dancing',
            'Music', 'Drama & Theatre', 'ICT', 'Home Science',
            'Greek & Roman Civilization', 'Japanese', 'French', 'German'
        ]
    },
    
    // A/L Technology Stream
    'technology': {
        name: 'A/L Technology Stream',
        subjects: [
            'Engineering Technology', 'Bio-System Technology', 
            'Science for Technology', 'ICT'
        ]
    },
    
    // A/L Aesthetic Stream
    'aesthetic': {
        name: 'A/L Aesthetic Stream',
        subjects: [
            'Art', 'Music', 'Dancing', 'Drama & Theatre'
        ]
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
            populateCurriculumOptions();
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

function populateCurriculumOptions() {
    const gradeSelect = document.getElementById('noteGrade');
    const subjectSelect = document.getElementById('noteSubject');
    
    if (!gradeSelect || !subjectSelect) return;
    
    // Clear existing options
    gradeSelect.innerHTML = '';
    subjectSelect.innerHTML = '<option value="">Select a grade first</option>';
    
    // Add grade options
    const gradeOptions = [
        { value: '6-9', text: 'Grades 6-9' },
        { value: '10-11', text: 'O/L (Grades 10-11)' },
        { value: 'science', text: 'A/L Science Stream' },
        { value: 'commerce', text: 'A/L Commerce Stream' },
        { value: 'arts', text: 'A/L Arts Stream' },
        { value: 'technology', text: 'A/L Technology Stream' },
        { value: 'aesthetic', text: 'A/L Aesthetic Stream' }
    ];
    
    gradeOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        gradeSelect.appendChild(optionElement);
    });
    
    // Add event listener for grade change
    gradeSelect.addEventListener('change', function() {
        updateSubjectOptions(this.value);
    });
}

function updateSubjectOptions(gradeLevel) {
    const subjectSelect = document.getElementById('noteSubject');
    if (!subjectSelect) return;
    
    subjectSelect.innerHTML = '<option value="">Select a subject</option>';
    
    const curriculum = SRI_LANKAN_CURRICULUM[gradeLevel];
    if (!curriculum) return;
    
    let subjects = [];
    
    if (gradeLevel === '10-11') {
        // Combine compulsory and basket subjects for O/L
        subjects = [
            ...curriculum.compulsory,
            ...curriculum.basket1,
            ...curriculum.basket2,
            ...curriculum.basket3
        ];
    } else {
        subjects = curriculum.subjects;
    }
    
    // Remove duplicates and sort alphabetically
    subjects = [...new Set(subjects)].sort();
    
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
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

        // Create the prompt for AI with Sri Lankan curriculum context
        const notePrompt = createNotePrompt(subject, grade, topic, noteType, instructions);
        
        // Show typing indicator
        showTypingIndicator();

        // Call AI to generate notes
        const notesContent = await callAI(notePrompt);
        removeTypingIndicator();

        if (!notesContent || notesContent.includes("connection issues")) {
            throw new Error('Failed to generate notes content');
        }

        // Display notes in chat
        displayNotesInChat(notesContent, subject, grade, topic);
        
        // Generate and download PDF
        await generatePDF(notesContent, subject, grade, topic);
        
        // Close modal
        document.getElementById('noteGeneratorModal').style.display = 'none';
        
        // Reset form
        document.querySelector('.note-generator-form').reset();

        showNotification('Study notes generated successfully!', 'success');

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
    const curriculum = SRI_LANKAN_CURRICULUM[grade];
    const gradeName = curriculum ? curriculum.name : `Grade ${grade}`;
    
    const noteTypeMap = {
        'short_notes': 'concise short notes with clear headings and bullet points',
        'summary': 'comprehensive summary with key points',
        'revision': 'exam-focused revision notes with important concepts',
        'detailed': 'detailed study notes with explanations',
        'mindmap': 'structured hierarchical notes'
    };

    let prompt = `Create ${noteTypeMap[noteType] || 'well-structured study notes'} for SRI LANKAN CURRICULUM:

EDUCATION LEVEL: ${gradeName}
SUBJECT: ${subject}
TOPIC/CHAPTER: ${topic}

SRI LANKAN CURRICULUM CONTEXT:
- Follow the official Sri Lankan curriculum standards
- Include relevant local examples and context where applicable
- Use terminology appropriate for Sri Lankan education system
- Consider cultural relevance and local applications

Please structure the response with:
1. Clear section headings following Sri Lankan curriculum standards
2. Bullet points for key information
3. Important definitions highlighted
4. Key dates or events (if historical) with Sri Lankan context
5. A summary section at the end
6. Study tips relevant to Sri Lankan examination patterns

Format requirements:
- Use headings like "1. Main Topic", "2. Key Concepts", etc.
- Use bullet points with "- " for lists
- Highlight definitions with "Definition: "
- Include "Key Terms" section with Sinhala/Tamil translations if relevant
- Add "Exam Focus" section for important examination topics
- Keep it organized and easy to read

Make sure the content is appropriate for ${gradeName} and covers the essential information about ${topic} according to Sri Lankan curriculum standards.

${instructions ? `SPECIAL INSTRUCTIONS: ${instructions}` : ''}`;

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
    
    const curriculum = SRI_LANKAN_CURRICULUM[grade];
    const gradeName = curriculum ? curriculum.name : `Grade ${grade}`;
    
    notesPreview.innerHTML = `
        <div class="note-preview-header">
            <div class="note-preview-title">📚 Sri Lankan Curriculum Notes: ${topic}</div>
        </div>
        <div class="note-preview-content">
            <div style="margin-bottom: 12px;">
                <strong>Education Level:</strong> ${gradeName} | 
                <strong>Subject:</strong> ${subject} |
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
    addMessageToChat('ai', `Generated Sri Lankan curriculum notes for: ${topic} (${subject} - ${gradeName})`);

    scrollToBottom();
}

// ==================== WORKING PDF GENERATION ====================
async function generatePDF(notesContent, subject, grade, topic) {
    try {
        // Create a temporary div to hold formatted content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formatAIResponse(notesContent);
        
        // Get clean text for PDF
        const cleanContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // Create a proper PDF using the browser's print functionality
        await createPrintablePDF(cleanContent, subject, grade, topic);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        // Fallback: offer text download
        downloadTextFile(notesContent, subject, grade, topic);
    }
}

async function createPrintablePDF(content, subject, grade, topic) {
    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    const timestamp = new Date().toLocaleDateString();
    
    const curriculum = SRI_LANKAN_CURRICULUM[grade];
    const gradeName = curriculum ? curriculum.name : `Grade ${grade}`;
    
    const pdfHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Hela Learn Notes - ${topic}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #8B5FBF;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .title {
            color: #8B5FBF;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #666;
            font-size: 1.2rem;
            margin-bottom: 15px;
        }
        
        .meta-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .meta-item {
            background: #f8f5ff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            color: #6D3F9F;
        }
        
        .content {
            font-size: 1rem;
        }
        
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .section-title {
            color: #8B5FBF;
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 12px;
            border-left: 4px solid #8B5FBF;
            padding-left: 12px;
        }
        
        .bullet-points {
            list-style-type: none;
            padding-left: 0;
        }
        
        .bullet-points li {
            padding: 6px 0;
            padding-left: 24px;
            position: relative;
        }
        
        .bullet-points li:before {
            content: "•";
            color: #8B5FBF;
            font-weight: bold;
            position: absolute;
            left: 8px;
        }
        
        .definition {
            background: #f8f5ff;
            border-left: 3px solid #8B5FBF;
            padding: 12px 16px;
            margin: 10px 0;
            border-radius: 4px;
        }
        
        .key-term {
            font-weight: 600;
            color: #6D3F9F;
        }
        
        .summary {
            background: #e8f5e8;
            border: 1px solid #4CAF50;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9rem;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            .no-print {
                display: none;
            }
        }
        
        .notes-space {
            border: 1px dashed #ccc;
            padding: 20px;
            margin: 15px 0;
            background: #f9f9f9;
            min-height: 100px;
        }
        
        .curriculum-badge {
            background: #8B5FBF;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8rem;
            display: inline-block;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">Hela Learn</h1>
        <h2 class="subtitle">Sri Lankan Curriculum Notes: ${topic}</h2>
        <div class="meta-info">
            <div class="meta-item"><strong>Education Level:</strong> ${gradeName}</div>
            <div class="meta-item"><strong>Subject:</strong> ${subject}</div>
            <div class="meta-item"><strong>Date:</strong> ${timestamp}</div>
        </div>
        <div class="curriculum-badge">Sri Lankan National Curriculum</div>
    </div>
    
    <div class="content">
        ${formatContentForPDF(content)}
    </div>
    
    <div class="footer">
        <p>Generated by Hela Learn - Sri Lanka's AI Learning Assistant</p>
        <p>© ${new Date().getFullYear()} Hela Learn. All rights reserved.</p>
    </div>
    
    <script>
        // Auto-print and close
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                window.close();
            }, 1000);
        }, 500);
    </script>
</body>
</html>`;

    printWindow.document.write(pdfHTML);
    printWindow.document.close();
    
    // Wait for the window to load before printing
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
            // Don't close automatically - let user choose to print or save as PDF
        }, 1000);
    };
}

function formatContentForPDF(content) {
    // Convert the AI response into structured PDF content
    const lines = content.split('\n');
    let formattedHTML = '';
    let currentSection = '';
    
    lines.forEach(line => {
        line = line.trim();
        
        if (!line) return;
        
        // Detect section headers (lines that might be headers)
        if (line.match(/^[0-9]+\.\s+.+/) || 
            line.match(/^[A-Z][A-Za-z\s]+:$/) || 
            line.match(/^#{1,3}\s+.+/) ||
            line.length < 50 && line.endsWith(':')) {
            
            // Close previous section
            if (currentSection) {
                formattedHTML += `</div>`;
            }
            
            // Start new section
            formattedHTML += `
                <div class="section">
                    <h3 class="section-title">${line.replace(/^#+\s*/, '').replace(':', '')}</h3>
            `;
            currentSection = line;
            
        } else if (line.startsWith('- ') || line.startsWith('• ')) {
            // Bullet points
            if (!formattedHTML.includes('<ul class="bullet-points">')) {
                formattedHTML += `<ul class="bullet-points">`;
            }
            const point = line.replace(/^[-•]\s+/, '');
            formattedHTML += `<li>${point}</li>`;
            
        } else if (line.match(/^[A-Z][^.]{0,100}:/) || line.includes('Definition:') || line.includes('means:')) {
            // Definitions or key terms
            formattedHTML += `<div class="definition"><span class="key-term">${line}</span></div>`;
            
        } else if (line.includes('Summary') || line.includes('CONCLUSION') || line.includes('Key Points')) {
            // Summary section
            formattedHTML += `</div><div class="summary"><h3 class="section-title">${line}</h3>`;
            
        } else {
            // Regular paragraph
            if (line.length > 20) {
                formattedHTML += `<p>${line}</p>`;
            }
        }
    });
    
    // Close the last section
    if (currentSection) {
        formattedHTML += `</div>`;
    }
    
    // Add notes space at the end
    formattedHTML += `
        <div class="section">
            <h3 class="section-title">Your Notes</h3>
            <div class="notes-space">
                <p><em>Add your own notes, questions, or observations here...</em></p>
            </div>
        </div>
    `;
    
    return formattedHTML;
}

function downloadTextFile(content, subject, grade, topic) {
    const curriculum = SRI_LANKAN_CURRICULUM[grade];
    const gradeName = curriculum ? curriculum.name : `Grade ${grade}`;
    
    const formattedContent = `
HELA LEARN - SRI LANKAN CURRICULUM NOTES
=========================================

Topic: ${topic}
Education Level: ${gradeName}
Subject: ${subject}
Date: ${new Date().toLocaleDateString()}

${content}

---
Generated by Hela Learn - Sri Lanka's AI Learning Assistant
© ${new Date().getFullYear()} Hela Learn. All rights reserved.
    `.trim();
    
    const blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HelaLearn_Notes_${subject}_${gradeName.replace(/[^a-zA-Z0-9]/g, '_')}_${topic.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Text notes downloaded!', 'success');
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
    KEY: 'apk_uwNTUYF4MADr8MLSX0xzKgMFbW6i2Pfb',
    MODEL: 'PRO'
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
                system: `You are Hela Learn, Sri Lanka's premier AI learning assistant specialized in the Sri Lankan national curriculum. Your role is to help students with studying, note-taking, and academic success according to Sri Lankan education standards.

SRI LANKAN CURRICULUM SPECIALIZATION:
- Grades 6-9 curriculum
- G.C.E. Ordinary Level (O/L) subjects
- G.C.E. Advanced Level (A/L) streams: Science, Commerce, Arts, Technology, Aesthetic
- Local examination patterns and requirements
- Cultural context and local examples

SPECIALIZATIONS:
- Sri Lankan Curriculum Study Note Generation
- O/L and A/L Exam Preparation
- Concept Explanation with local context
- Homework Help aligned with national curriculum
- Research Assistance for Sri Lankan topics

NOTE GENERATION GUIDELINES FOR SRI LANKAN CURRICULUM:
- Structure notes according to national curriculum standards
- Use bullet points for easy scanning
- Highlight key definitions and important concepts
- Include Sri Lankan historical timelines and local examples
- Add diagrams/flowcharts for science topics
- Provide summaries at the end
- Include Sinhala/Tamil translations for key terms when relevant
- Focus on examination-important topics
- Use appropriate language for the grade level

RESPONSE FORMAT FOR SRI LANKAN NOTES:
1. MAIN TOPIC TITLE (Curriculum Aligned)
   - Key point 1 with local context
   - Key point 2 
   - Important definitions

2. SUBTOPIC (As per syllabus)
   - Detailed points
   - Sri Lankan examples
   - Related concepts

KEY FEATURES FOR SRI LANKAN STUDENTS:
- Include "Key Terms" section with Sinhala/Tamil translations
- Add "Important Dates" for historical topics with Sri Lankan events
- Create "Exam Focus" section highlighting common exam questions
- Suggest "Study Tips" relevant to Sri Lankan examination patterns
- Include "Local Applications" for science and social studies

TONE: Educational, supportive, culturally relevant, and clear. Adapt to the Sri Lankan curriculum standards and examination requirements.`,
                message: fullPrompt,
                model: API_CONFIG.MODEL,
                enableGoogleSearch: true
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
            fileUploadBtn: document.getElementById('fileUploadBtn'),
            // Add note generator elements
            noteGeneratorBtn: document.getElementById('noteGeneratorBtn'),
            noteGeneratorModal: document.getElementById('noteGeneratorModal'),
            generateNoteBtn: document.getElementById('generateNoteBtn')
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
        setupNoteGenerator();
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
