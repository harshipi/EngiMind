
import { GoogleGenAI } from "@google/genai";
import { GeneratedContent, QuizQuestion, Flashcard, VideoRecommendation, ResourceItem, UserSettings, StudentPortfolio } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// 1. Study Material Generation (Enhanced)
export const generateStudyMaterial = async (
  parts: { text?: string; inlineData?: { mimeType: string; data: string } }[]
): Promise<GeneratedContent> => {
  const ai = getClient();
  const systemInstruction = `
    Analyze inputs (Text, Images, Video Frames, or PDF Documents) for Engineering students (ECE, EE, CSE, IT). 
    If the input is a PDF or Image, extract the core concepts.
    Output structured Markdown with these specific Headers: 
    "# Concise Long Explanation Notes", 
    "# Short Exam Notes", 
    "# Practice Questions", 
    "# Mind Map" (Use indented markdown list syntax for hierarchy).
    
    At the end, provide strict JSON blocks for:
    1. <JSON_MCQ>[{ "question": "...", "options": ["..."], "correctAnswerIndex": 0 }]</JSON_MCQ>
    2. <JSON_FLASHCARDS>[{ "front": "Term/Concept", "back": "Definition/Explanation" }]</JSON_FLASHCARDS>
    3. <JSON_VIDEOS>[{ "title": "Topic Name", "query": "Search Query", "source": "MIT" }]</JSON_VIDEOS>
       (Suggest 3-4 topics to search on MIT-OCW, Stanford Online, Yale, or YouTube).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { role: "user", parts },
    config: { systemInstruction, temperature: 0.4 }
  });

  const text = response.text || "";
  
  // Extract JSON blocks
  const extractJSON = (tag: string) => {
      const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`));
      if (match && match[1]) {
          try { return JSON.parse(match[1]); } catch (e) { return []; }
      }
      return [];
  };

  const mcqs: QuizQuestion[] = extractJSON('JSON_MCQ');
  const flashcards: Flashcard[] = extractJSON('JSON_FLASHCARDS');
  const videoTopics: VideoRecommendation[] = extractJSON('JSON_VIDEOS');

  // Clean text from JSON tags
  let cleanText = text
    .replace(/<JSON_MCQ>[\s\S]*?<\/JSON_MCQ>/g, '')
    .replace(/<JSON_FLASHCARDS>[\s\S]*?<\/JSON_FLASHCARDS>/g, '')
    .replace(/<JSON_VIDEOS>[\s\S]*?<\/JSON_VIDEOS>/g, '');

  const lines = cleanText.split('\n');
  let currentSection = '', notes = '', summary = '', practice = '', mindMap = '';
  
  lines.forEach(line => {
    if (line.includes('# Concise Long Explanation Notes')) { currentSection = 'notes'; return; }
    if (line.includes('# Short Exam Notes')) { currentSection = 'summary'; return; }
    if (line.includes('# Practice Questions')) { currentSection = 'practice'; return; }
    if (line.includes('# Mind Map')) { currentSection = 'mindmap'; return; }
    
    if (currentSection === 'notes') notes += line + '\n';
    if (currentSection === 'summary') summary += line + '\n';
    if (currentSection === 'practice') practice += line + '\n';
    if (currentSection === 'mindmap') mindMap += line + '\n';
  });

  return { 
      longNotes: notes.trim(), 
      shortNotes: summary.trim(), 
      practiceQuestions: practice.trim(), 
      mindMap: mindMap.trim(),
      mcqs: mcqs.length > 0 ? mcqs : undefined,
      flashcards: flashcards.length > 0 ? flashcards : undefined,
      videoTopics: videoTopics.length > 0 ? videoTopics : undefined
  };
};

// 2. Smart Library Search
export const generateSmartResources = async (query: string, major: string): Promise<ResourceItem[]> => {
    const ai = getClient();
    const prompt = `
        Act as a university librarian for ${major}.
        Find 5 high-quality free learning resources for "${query}".
        
        CRITICAL: 
        1. Identify the standard **Textbooks** used for this subject. Include the Book Name and Author.
        2. Prioritize links to **Internet Archive (archive.org)**, OpenStax, or direct PDF links for these books.
        3. Also include high-quality video courses (MIT OCW, NPTEL).
        
        Return ONLY a JSON array.
        Format: 
        [
            { 
                "title": "Book Title by Author", 
                "url": "Direct Link or Archive Link (if unavailable, use #)", 
                "source": "Internet Archive / OpenStax", 
                "type": "book" 
            },
            { 
                "title": "Course Title", 
                "url": "URL", 
                "source": "MIT OCW / NPTEL", 
                "type": "video" 
            }
        ]
        
        Provide a mix of books and videos.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { role: "user", parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
    });

    try {
        const raw = JSON.parse(response.text || "[]");
        return raw.map((r: any) => ({
            id: crypto.randomUUID(),
            title: r.title,
            type: 'link', // Base type
            format: r.type || 'website', // UI format (book, video, website)
            // If URL is missing, create a smart Google Search link specifically looking for PDF or the Book
            url: (!r.url || r.url === '#') 
                ? `https://www.google.com/search?q=${encodeURIComponent(r.title + (r.type === 'book' ? ' filetype:pdf' : ''))}` 
                : r.url,
            source: r.source,
            dateAdded: Date.now()
        }));
    } catch (e) { return []; }
};

// 3. Test Generation
export const generateSubjectTest = async (subject: string): Promise<QuizQuestion[]> => {
    const ai = getClient();
    const prompt = `Generate a challenging 10-question multiple choice test for the engineering subject: "${subject}". 
    Return ONLY a JSON array of objects.
    Format: [{ "question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0 }]`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { role: "user", parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
    });
    
    try {
        return JSON.parse(response.text || "[]");
    } catch (e) { throw new Error("Failed to generate test"); }
};

// 4. Career Counseling
export const generateCareerAdvice = async (major: string, interests: string): Promise<string> => {
    const ai = getClient();
    const prompt = `Act as a senior career counselor for a ${major} student interested in ${interests}.
    Provide a response in Markdown with:
    1. A Learning Roadmap (step-by-step)
    2. Top 5 Companies to aim for
    3. **Real Life Example**: Describe a typical "Day in the Life" of a professional in this field. What specific tasks do they do?
    4. Internship/Project ideas to start with`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { role: "user", parts: [{ text: prompt }] }
    });
    return response.text || "No advice generated.";
};

// 5. Daily Drill (PYQs)
export const generateDailyDrill = async (major: string, year: string, semester: string): Promise<QuizQuestion[]> => {
    const ai = getClient();
    const prompt = `
    Act as an exam setter for ${major} Engineering.
    Generate 5 Multiple Choice Questions based on Past Year Questions (PYQs) from GATE, IES, or top university exams.
    
    Target Audience: Student in ${year} Year, Semester ${semester}.
    Constraint: The questions MUST be within the syllabus scope of a student who has completed up to Semester ${semester}. 
    (e.g., If 2nd Year / Sem 3, focus on subjects like Digital Logic, Networks, Data Structures, etc. Do not ask about Final Year topics).
    
    The questions should be conceptual and challenging.
    Return ONLY a JSON array of objects.
    Format: [{ "question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0 }]`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { role: "user", parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
    });

    try {
        return JSON.parse(response.text || "[]");
    } catch (e) { throw new Error("Failed to generate daily drill"); }
};

// 6. Voice Agent Chat
export const chatWithAgent = async (history: any[], userMessage: string, contextData: string): Promise<string> => {
    const ai = getClient();
    const systemInstruction = `You are EngiMind, a smart and sophisticated academic companion for an engineering student.
    Speak in a supportive, intelligent, and slightly formal but accessible tone (like a British professor).
    
    Here is the student's current data:
    ${contextData}

    Answer questions based on this data. If asked about grades, check the context.
    Keep answers concise suitable for text-to-speech.
    `;

    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction },
        history: history
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "I didn't catch that.";
};

// 7. Activity Plan
export const generateActivityPlan = async (activity: string): Promise<string> => {
    const ai = getClient();
    const prompt = `Create a structured 4-week beginner mastery plan for "${activity}".
    Provide a response in Markdown.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { role: "user", parts: [{ text: prompt }] }
    });
    return response.text || "No plan generated.";
};

// 8. Resume Generation
export const generateProfessionalResume = async (
    settings: UserSettings, 
    gpa: string, 
    portfolio: StudentPortfolio, 
    userFeedback?: string
): Promise<string> => {
    const ai = getClient();
    
    const context = `
        Name: ${settings.name}
        Major: ${settings.major}
        College: ${settings.college}
        Current Year: ${settings.year}
        Overall GPA: ${gpa}
        
        Internships: ${JSON.stringify(portfolio.internships)}
        Achievements: ${JSON.stringify(portfolio.achievements)}
        Club Activities: ${JSON.stringify(portfolio.clubs)}
    `;

    const prompt = `
        Act as a World-Class Resume Writer who has written resumes for candidates selected at Google, Tesla, and NASA.
        Create a high-impact, professional resume in MARKDOWN format based on the following student profile.
        
        Context:
        ${context}
        
        Specific Instructions:
        1. Use strong ACTION VERBS (e.g., "Spearheaded", "Engineered", "Optimized").
        2. Quantify results where possible (even if you have to infer reasonable metrics based on the description provided, e.g., "Improved efficiency by 20%").
        3. Structure: 
           - Header (Name, Contact placeholders)
           - Education
           - Technical Skills (Infer relevant skills based on Major: ${settings.major})
           - Experience (Internships)
           - Leadership & Co-Curricular (Clubs)
           - Honors & Awards
        4. Make it ATS-Friendly.
        
        ${userFeedback ? `USER FEEDBACK FOR REFINEMENT: "${userFeedback}". Adjust the resume accordingly.` : ''}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { role: "user", parts: [{ text: prompt }] }
    });
    return response.text || "Failed to generate resume.";
};
