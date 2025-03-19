import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Message } from 'react-chat-ui';
import { marked } from 'marked';

const API_BASE_URL = 'https://awesome-conductor-apps.onrender.com'; //'http://localhost:5000'

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [isInterviewDone, setIsInterviewDone] = useState(false);
  const [isFirstQDone, setIsFirstQDone] = useState(false);
  const [isSecondQDone, setIsSecondQDone] = useState(false);
  const [isThirdQDone, setIsThirdQDone] = useState(false);

  const [isInitialStepDone, setIsInitialStepDone] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const chatBoxRef = useRef(null);
  const textareaRef = useRef(null);
  const maxHeight = 150;

  useEffect(() => {
    startWorkflow();
  }, []);

  const startWorkflow = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/start_workflow`);
      const response = await axios.get(`${API_BASE_URL}/get_most_recent_message`);
      addMessage(response.data.message, 'Bot');
    } catch (error) {
      handleError("The interview has terminated unexpectedly. There was an error starting the workflow.");
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (text, sender) => {
    if (!text) return;
    const messageHtml = marked(text.replace(/\\n/g, '  \n')); // Ensure line breaks are handled
    setMessages((prevMessages) => [
      ...prevMessages,
      new Message({ id: Date.now(), message: messageHtml, senderName: sender })
    ]);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);

    if (textareaRef.current) {
      // Temporarily reset the height to 'auto' to calculate the scrollHeight
      textareaRef.current.style.height = 'auto';

      // Expand height only when content exceeds initial height
      if (textareaRef.current.scrollHeight > textareaRef.current.clientHeight) {
        const scrollHeight = textareaRef.current.scrollHeight;
        // Set height to the scrollHeight, but not exceeding maxHeight
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      }
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    addMessage(userInput, 'User');
    setUserInput('');
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = '40px';

    try {
      // 3rd Q Loop
      if (isInitialStepDone && isEmailValid && isFirstQDone && isSecondQDone && !isThirdQDone) {
        await handleCoreInterviewLoop();
        await checkQuestionStatus(3);
      // 2nd Q Loop
      } else if (isInitialStepDone && isEmailValid && isFirstQDone && !isSecondQDone && !isThirdQDone) {
        await handleCoreInterviewLoop();
        await checkQuestionStatus(2);
      // 1st Q Loop
      } else if (isInitialStepDone && isEmailValid && !isFirstQDone && !isSecondQDone && !isThirdQDone) {
        await handleCoreInterviewLoop();
        await checkQuestionStatus(1);
      // Process Email Step
      } else if (isInitialStepDone && !isEmailValid) {
        await processEmailStep();
      // Process Initial Name & Language Step
      } else {
        await processInitialStep();
      }
    } catch (error) {
      handleError("The interview has terminated unexpectedly. There was an error fetching the bot's response.");
    } finally {
      setLoading(false);
    }
  };

  const processInitialStep = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/send_name_language`, { userInput });
      const initialLoopStatus = await axios.get(`${API_BASE_URL}/get_is_initial_step_done`);
      setIsInitialStepDone(initialLoopStatus.data.message);

      if (initialLoopStatus.data.message) {
        addMessage(response.data.message, 'Bot');
      } else {
        addMessage(response.data.message || "Sorry, I didn't understand that.", 'Bot');
      }
    } catch (error) {
      handleError("The interview has terminated unexpectedly. There was an error processing the initial step.");
    }
  };

  const processEmailStep = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/send_email_address`, { userInput });
      const emailLoopStatus = await axios.get(`${API_BASE_URL}/get_is_email_valid`);
      setIsEmailValid(emailLoopStatus.data.message);

      if (emailLoopStatus.data.message) {
        await getInterviewQuestion(true);
      } else {
        addMessage(response.data.message || "Sorry, I didn't understand that.", 'Bot');
      }
    } catch (error) {
      handleError("The interview has terminated unexpectedly. There was an error processing the email step.");
    }
  };

  const getInterviewQuestion = async (getTwo) => {
    // Start new subworkflow routine
    const sub_workflow_id = await axios.get(`${API_BASE_URL}/get_sub_workflow_id`);
    console.log(`Starting sub_workflow id: ${sub_workflow_id.data.message}`);

    // Get question for user
    const startQuestionMsg = await axios.get(`${API_BASE_URL}/get_question`);
    const botMessages = startQuestionMsg.data.message.map(msg => {
      const messageHtml = marked(msg);
      return {
        id: Date.now(),
        message: messageHtml,
        senderName: 'Bot'
      };
    });
    // Select only the required number of messages
    const filteredBotMessages = getTwo ? botMessages : botMessages.slice(-1);

    // Update messages state
    setMessages(prevMessages => [...prevMessages, ...filteredBotMessages]);
  };

  const handleCoreInterviewLoop = async () => {
    const response = await axios.post(`${API_BASE_URL}/send_user_input`, { userInput });
    addMessage(response.data.message || "Sorry, I didn't understand that.", 'Bot');
  };

  const checkQuestionStatus = async (q_id) => {
    const isQuestionDone = await axios.get(`${API_BASE_URL}/get_question_status`);
    const questionStatus = isQuestionDone.data.message
    const overtimeStatus = isQuestionDone.data.isOvertime
    console.log(`QUESTION STATUS: ${isQuestionDone.data.message}`)
    console.log(`OVERTIME STATUS: ${isQuestionDone.data.isOvertime}`)

    // DONE Case
    if (questionStatus === 'DONE' && !overtimeStatus) {
      // setIsInterviewTerminating(true);
      await axios.post(`${API_BASE_URL}/update_messages`, { question: "wait_till_question_done_ref", is_overtime: isQuestionDone.data.isOvertime });

      // switch case for questions 1/2/3
      switch (q_id) {
        case 1:
          setIsFirstQDone(true);
          console.log("DONE UPDATING Q1 MESSAGES");
          await getInterviewQuestion(false);
          break;
        case 2:
          setIsSecondQDone(true);
          console.log("DONE UPDATING Q2 MESSAGES");
          await getInterviewQuestion(false);
          break;
        case 3:
          setIsThirdQDone(true);
          console.log("DONE UPDATING Q3 MESSAGES");
          await handleFinalStep();
          break;
        default:
          console.log("Invalid question ID");
          break;
      }
    // TERMINATE Case (overtime)
    } else if (overtimeStatus) {
      console.log("TERMINATION DUE TO OVERTIME");
      await axios.post(`${API_BASE_URL}/update_messages`, { question: "wait_till_question_done_ref", is_overtime: isQuestionDone.data.isOvertime });
      await handleFinalStep();
    }
  };

  const handleFinalStep = async () => {
    const isFinalStepDone = await axios.get(`${API_BASE_URL}/get_is_final_step_done`);
    if (isFinalStepDone.data.message) {
      // Get final message
      const response = await axios.get(`${API_BASE_URL}/get_most_recent_message`);
      addMessage(response.data.message, 'Bot');
      // Terminate conductor workers
      await axios.post(`${API_BASE_URL}/stop_workers`);
      setIsInterviewDone(true);
    }
  };

  const handleError = async (errorMessage) => {
    await axios.post(`${API_BASE_URL}/stop_workflow`);
    addMessage(errorMessage, 'Bot');
    setIsInterviewDone(true);
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [!loading]);

  return (
    <div className="chat-container">
      <h1>Interview Chat</h1>
      <div ref={chatBoxRef} className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.senderName === 'User' ? 'user-message' : 'bot-message'}`}>
            <div dangerouslySetInnerHTML={{ __html: msg.message }} />
          </div>
        ))}
        {loading && (
          <div className="chat-bubble bot-message typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
      <div className="input-box">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); // Prevent default enter behavior
              handleSubmit(); // Submit the message
            } else if (e.key === 'Enter' && e.shiftKey) {
              e.preventDefault();
              setUserInput((prev) => {
                const updatedInput = prev + '\n';
                setTimeout(() => handleInputChange({ target: { value: updatedInput } }), 0);
                return updatedInput;
              });
            }
          }}
          placeholder="Type your response..."
          disabled={loading || isInterviewDone}
        />
        <button onClick={handleSubmit} disabled={loading || isInterviewDone}>Send</button>
      </div>
    </div>
  );
}