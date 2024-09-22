import React, {useEffect,useRef,useState} from "react"

type SpeechRecognitionOptions = {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  };

const useSpeechRecognition = (options: SpeechRecognitionOptions) =>{
    const [transcript,setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null); 

    useEffect(() => {
        if(!("webkitSpeechRecognition" in window)){
            console.error("not supported")
            return;
        }

        recognitionRef.current = new window.webkitSpeechRecognition()
        const recognition = recognitionRef.current
        recognition.interimResults = options.interimResults || true
        recognition.lang = options.language || "en-US"
        recognition.continuous = options.continuous || false

        if("webkitSpeechGrammarList" in window){
            const grammar = "JSGF V1,0; grammar punctuationl public <punc> = . | , | ? | ! | ; | : ;"
            const SpeechRecognitionList = new window.webkitSpeechGrammarList()
            SpeechRecognitionList.addFromString(grammar, 1)
            recognition.grammars = SpeechRecognitionList
        }

        recognition.onresult = (event) => {
            console.log("onresult event:", event);
            let text = ""
            for(let i = 0; i < event.results.length; i++){
                text += event.results[i][0].transcript
            }
            setTranscript(text);
        }
        recognition.onerror = (event) => {
            console.error("speech recog error:" , event.error)
        }

        recognition.onend = () => {
            setIsListening(false)
            setTranscript("")
        }       
        
        return () => {
            recognition.stop()
        }        
    }, []);

    const startListening = () => {
        if(recognitionRef.current && !isListening){
            recognitionRef.current.start()
            setIsListening(true);
        }
       
    };
    const stopListening = () => {
        if(recognitionRef.current && isListening){
            recognitionRef.current.stop()
            setIsListening(false);
        }
       
    };

    return {
        isListening,
        transcript,
        startListening,
        stopListening
    }
}

export default useSpeechRecognition;