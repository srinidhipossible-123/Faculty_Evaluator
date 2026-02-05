export const BATCHES = [
    'Batch 1',
    'Batch 2',
    'Batch 3',
    'Batch 4',
    'Batch 5',
    'Batch 6',
    'Batch 7',
    'Batch 8'
]; // Maximum 8 batches

export const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: "What is the primary purpose of React's useEffect hook?",
        options: [
            "To handle state management",
            "To perform side effects in function components",
            "To memoize expensive calculations",
            "To create routing logic"
        ],
        correctAnswer: 1, // Index of correct option
        section: "React Core"
    },
    {
        id: 2,
        question: "Which firebase service is used for NoSQL database storage?",
        options: [
            "Cloud Functions",
            "Authentication",
            "Firestore",
            "Hosting"
        ],
        correctAnswer: 2,
        section: "Backend"
    },
    {
        id: 3,
        question: "How do you pass data from a parent to a child component in React?",
        options: [
            "Using State",
            "Using Props",
            "Using Redux",
            "Using Context"
        ],
        correctAnswer: 1,
        section: "React Core"
    },
    {
        id: 4,
        question: "What is the utility-first CSS framework used in this project?",
        options: [
            "Bootstrap",
            "Material UI",
            "Tailwind CSS",
            "Sass"
        ],
        correctAnswer: 2,
        section: "Styling"
    },
    {
        id: 5,
        question: "Which hook is used to access the current context value?",
        options: [
            "useState",
            "useContext",
            "useEffect",
            "useReducer"
        ],
        correctAnswer: 1,
        section: "React Core"
    }
];

export const ROLES = {
    PARTICIPANT: 'participant',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};
