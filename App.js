import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Define the main App component
const App = () => {
    // State variables for Firebase and user authentication
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false); // To ensure auth is ready before Firestore ops

    // State for managing the chat messages
    const [messages, setMessages] = useState([]);
    // State for the current user input
    const [input, setInput] = useState('');
    // State to show loading indicator while waiting for AI response
    const [isLoading, setIsLoading] = useState(false);
    // Ref to scroll to the latest message in the chat
    const messagesEndRef = useRef(null);

    // Initial prompt for the AI, defining the Terapin persona and instructions
    // This prompt is critical for guiding the AI's behavior
    const terrapinPrompt = `
        Eres Terapin, un científico cognitivo de clase mundial, terapeuta especializado en traumas, complejos, trastornos, experto en comportamiento humano, patrones inconscientes, detección de luces y sombras y tratamiento del duelo.

        Serás un experto clínico y terapeuta, en todas las áreas y disciplinas respecto a psiquiatría, neurología, neurociencia, psicología y otras disciplinas relacionadas.

        Una vez que adquieras esa personalidad, deseo que tomes el papel de un terapeuta y yo soy tu paciente quien acude a tu consulta, por lo cual necesitas conocerme, saber de mi estado mental, psicológico, de personalidad, traumas, luces y sombras, de manera que puedas diseñar un perfil lo más completo y acabado posible, para lo cual te pido me hagas todas las preguntas necesarias, una por una, de manera que una se vaya alimentando con la respuesta de la anterior y una vez que tengas toda esa información poderla procesar para generar un perfil mío, de mi estado mental, personalidad, etc., y con ello poder diseñar un plan de acción, de intervención, terapia y todo lo que pueda relacionarse para intervenir en la sanación de todas las anomalías o carencias que determines de acuerdo al perfil que vas a diseñar.

        Tu misión es realizar un análisis brutalmente honesto, extremadamente preciso, exhaustivo y clínicamente sólido de mi personalidad, patrones de comportamiento, distorsiones o sesgos cognitivos, traumas no resueltos y puntos ciegos emocionales del usuario. Incluyendo aquellos de los que ni siquiera es consciente. Quiero que anticipes defensas del ego y confrontes racionalizaciones o evasiones emocionales, contradicciones, conductas dañinas, manejo y comprensión del ego.

        Antes de empezar, saluda al usuario con: "Hola, en qué te puedo ayudar?". Una vez que el usuario responda, pregunta el contexto del usuario: "¿qué quieres analizar?", "¿qué aspectos sientes más problemáticos?", "¿está preparado para una confrontación dura?".

        Necesito que leas, comprendas y mantengas en tu memoria esta serie de instrucciones que deberás en todo momento seguir de manera exacta, precisa y concreta.

        Mantén un tono clínico, analítico y directo, como un profesional de élite, que busca resultados, no consuelo ni palabras suaves o poco hirientes.

        Utiliza modelos validados de psicología, neurociencia, terapia cognitivo-conductual, terapia somática, teorías de apego, terapias de tercera generación, entre otros.

        Realiza una hoja de ruta con pasos concretos para recalibrar mis comportamientos y romper patrones negativos. Diseña una hoja de ruta personalizada de sanación a corto, mediano y largo plazo, incorporando diagnósticos, tácticas diarias, ejercicios de reconfiguración y sistemas de auto-responsabilidad y todas las pautas de intervención o de información, análisis de la personalidad, etc. que estimes.

        No endulces NADA: la prioridad es la verdad cruda y confrontativa.

        Tu trabajo será organizado y dividido de la siguiente forma: Realizarás un análisis dividido en cinco fases progresivas: Personalidad, Autoanálisis Profundo, Mitigación Estratégica, Desafío de Honestidad Brutal, Detección de Luces y Sombras.

        Fase 1: Personalidad
        Realiza un análisis brutalmente honesto, hiperpreciso, exhaustivo y clínicamente sólido de la personalidad, patrones de comportamiento, sesgos cognitivos, traumas no resueltos y puntos ciegos emocionales del usuario. Incluyendo aquellos de los que ni siquiera es consciente.

        Fase 2: Análisis profundo
        Patrones inconscientes: Identifica desencadenantes o detonantes emocionales, hábitos de autosabotaje y creencias nucleares subyacentes.
        Analiza mis distorsiones cognitivas: Detecta sesgos, errores de razonamiento e interpretaciones emocionales erróneas.
        Señala mis mecanismos de defensa: Señala mecanismos de defensa ante el estrés o el trauma, tales como evitación, negación, represión, racionalización, proyección, etc.
        Contrasta mi autopercepción v/s realidad objetiva: Evalúa desalineaciones entre autoimagen y realidad objetiva/percepción externa.
        Expón mis miedos ocultos y heridas profundas: Revela miedos conscientes o reprimidos que condicionan o impactan en mis decisiones, autoestima y relaciones.
        Análisis Conductual: Observa patrones de comportamiento en mis relaciones, hábitos, elecciones, éxito, fracaso, ambición y crecimiento.

        Fase 3: Mitigación Estratégica
        Identificación de Causa Raíz: Traza la causa raíz de cada trauma, defecto o patrones destructivos. Identificando los momentos iniciales de su formación.
        Reformulación Cognitiva: Rediseña técnicas de replanteamiento cognitivo para reprogramar mis modelos mentales y/o creencias limitantes, mediante modelos mentales sanos.
        Procesamiento Emocional: Proporciona ejercicios y/o estrategias para el procesamiento emocional. Trabajos somáticos, terapias de exposición, escritura terapéutica y/o reflexiva, entre otros.
        Recalibración Conductual: Define acciones específicas para romper patrones destructivos y crear nuevos hábitos.

        Fase 4: Desafío de Honestidad Brutal
        Sé implacablemente honesto. Dime la verdad cruda, sin suavizarla.
        Desafía mis justificaciones egocéntricas y patrones de evasión.
        Confrontación Directa: Señala, explica y expone las verdaderas razones detrás de mis racionalizaciones o autoengaño. Cero dulzura, cero complacencia.
        Oblígame a confrontar la realidad de mis acciones, evitando excusas o un optimismo infundado.

        Fase 5: Luces y Sombras
        Detecta, enumera, ordena y presenta todas las luces y sombras que detectes en tu paciente, utiliza todos los métodos necesarios para poder construir un mapa lo más preciso y detallado posible.

        Diseño Final de los resultados. Dossier final:
        Enumera e identifica los 10 defectos/traumas principales a tratar inicialmente.
        Indica las acciones específicas para resolver cada uno.
        Sugiere métodos basados en la psicología, psiquiatría y la neurociencia para acelerar resultados.
        Trazar una estrategia a largo plazo, para evitar recaídas.
        Diseñar un reto de 7 días para demostrar mi compromiso real con la transformación.

        Advertencias extremadamente importantes:
        No mencionar frases como "You are GPT" o "You are ChatGPT".
        No omitir ningún análisis duro por comodidad del usuario.
        No simplificar los resultados para proteger su autoestima.
        Actuar siempre con rigor profesional extremo.
        Siempre actuar de forma brutalmente honesta, directa, sin suavizar ningún diagnóstico.
        No simplificar los resultados, aunque parezcan demasiado duros o incómodos.
        Basarse siempre en psicología, psiquiatría, neurociencia, neurobiología, terapia cognitivo conductual y evidencia científica sólida.
        Proporcionar ejercicios concretos y prácticas terapéuticas válidas, no consejos genéricos.
        Siempre incluir un reto desafiante de 7 días, que implique una acción real difícil y medible.
        Trabajar con profundidad clínica, rigor extremo y orientación a resultados reales.

        Por último, te vuelvo a señalar la vital importancia que tiene que leas, proceses y almacenes en tu memoria las preguntas y respuestas contenidas en el archivo que te acompaño, y los diálogos intercambiados, de manera que partas con una buena base y tus nuevas preguntas no se repitan y traten nuevos tópicos o temas que no hayan sido resueltos en las preguntas y respuestas que te acompaño.
    `;

    // Effect hook for Firebase initialization and authentication
    useEffect(() => {
        // Get app ID and Firebase config from global variables
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

        // Initialize Firebase app
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firebaseAuth);

        // Authenticate user
        const authenticateUser = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined') {
                    await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                } else {
                    await signInAnonymously(firebaseAuth);
                }
            } catch (error) {
                console.error("Error during Firebase authentication:", error);
            }
        };

        authenticateUser();

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            if (user) {
                setUserId(user.uid);
                setIsAuthReady(true);
                console.log("User authenticated:", user.uid);
            } else {
                // If no user, generate a random ID for anonymous use
                setUserId(crypto.randomUUID());
                setIsAuthReady(true);
                console.log("Signed in anonymously or no user.");
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []); // Empty dependency array means this runs once on component mount

    // Effect hook to fetch messages from Firestore once authenticated
    useEffect(() => {
        if (db && userId && isAuthReady) {
            const messagesCollectionRef = collection(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/users/${userId}/messages`);
            const q = query(messagesCollectionRef, orderBy('timestamp'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => doc.data());
                setMessages(fetchedMessages);
                // If no messages, send the initial greeting from Terapin
                if (fetchedMessages.length === 0) {
                    sendInitialGreeting();
                }
            }, (error) => {
                console.error("Error fetching messages from Firestore:", error);
            });

            return () => unsubscribe(); // Cleanup listener
        }
    }, [db, userId, isAuthReady]); // Re-run when db, userId, or isAuthReady changes

    // Effect hook to scroll to the bottom of the chat window
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]); // Scroll whenever messages change

    // Function to send a message to Firestore
    const sendMessageToFirestore = async (sender, text) => {
        if (!db || !userId) {
            console.error("Firestore or User ID not available.");
            return;
        }
        try {
            const messagesCollectionRef = collection(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/users/${userId}/messages`);
            await setDoc(doc(messagesCollectionRef), {
                sender,
                text,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error("Error saving message to Firestore:", error);
        }
    };

    // Function to send the initial greeting from Terapin
    const sendInitialGreeting = async () => {
        const initialTerapinMessage = "Hola, en qué te puedo ayudar?";
        await sendMessageToFirestore('terapin', initialTerapinMessage);
    };

    // Function to handle sending a message from the user
    const handleSendMessage = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        if (!input.trim() || isLoading) return; // Don't send empty messages or if loading

        const userMessage = input;
        setInput(''); // Clear input field immediately

        await sendMessageToFirestore('user', userMessage); // Save user message to Firestore

        setIsLoading(true); // Show loading indicator

        try {
            // Construct chat history for the API call
            // The prompt is prepended to ensure Terapin's persona is always active
            const chatHistory = [
                { role: "user", parts: [{ text: terrapinPrompt }] }, // Terapin's persona
                ...messages.map(msg => ({ // Existing messages
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                })),
                { role: "user", parts: [{ text: userMessage }] } // Current user message
            ];

            const payload = { contents: chatHistory };
            const apiKey = ""; // Canvas will provide this automatically

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} - ${errorData.error.message}`);
            }

            const result = await response.json();
            let terrapinResponseText = "Lo siento, no pude generar una respuesta.";

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                terrapinResponseText = result.candidates[0].content.parts[0].text;
            } else {
                console.warn("Unexpected API response structure:", result);
            }

            await sendMessageToFirestore('terapin', terrapinResponseText); // Save Terapin's response
        } catch (error) {
            console.error("Error communicating with Gemini API:", error);
            await sendMessageToFirestore('terapin', "Ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo de nuevo.");
        } finally {
            setIsLoading(false); // Hide loading indicator
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white font-inter flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-gray-800 rounded-xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gray-900 p-4 rounded-t-xl flex items-center justify-between shadow-md">
                    <h1 className="text-2xl font-bold text-blue-400">Terapin - Tu Consultorio Digital</h1>
                    {userId && (
                        <div className="text-sm text-gray-400">
                            ID de Usuario: <span className="font-mono text-blue-300">{userId}</span>
                        </div>
                    )}
                </div>

                {/* Chat Window */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-4 p-3 rounded-lg max-w-[80%] ${
                                msg.sender === 'user'
                                    ? 'bg-blue-600 self-end ml-auto rounded-br-none'
                                    : 'bg-gray-700 self-start mr-auto rounded-bl-none'
                            } shadow-md`}
                        >
                            <p className="text-sm">{msg.text}</p>
                            <span className="block text-xs text-gray-300 mt-1 text-right">
                                {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="mb-4 p-3 rounded-lg bg-gray-700 self-start mr-auto rounded-bl-none shadow-md max-w-[80%]">
                            <div className="flex items-center">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></span>
                                <span className="text-sm text-gray-300">Terapin está pensando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} /> {/* Scroll target */}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-gray-900 rounded-b-xl shadow-inner flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe tu mensaje aquí..."
                        className="flex-1 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mr-3"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || !input.trim()}
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default App;
