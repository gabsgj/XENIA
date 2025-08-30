
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { sendTutorMessageStream } from '../../services/geminiService';
import { ChatMessage } from '../../types';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { PaperAirplaneIcon, PaperClipIcon, UserCircleIcon, AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { GenerateContentResponse } from '@google/genai';

const AITutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { isLoading, setIsLoading, error, setError } = useAppContext();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !image) return;

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: input, image: imagePreview || undefined }],
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    setError(null);
    setInput('');
    removeImage();

    try {
      const stream = await sendTutorMessageStream(input, image || undefined);
      
      let currentModelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: '' }],
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, currentModelMessage]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        currentModelMessage.parts[0].text += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...currentModelMessage };
          return newMessages;
        });
      }

    } catch (e: any) {
      setError(e.message || "An error occurred with the AI Tutor.");
      console.error(e);
      setMessages(prev => [...prev, {role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }], timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-secondary rounded-lg overflow-hidden">
      <div className="p-4 border-b border-primary">
        <h1 className="text-xl font-bold">AI Tutor</h1>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <AcademicCapIcon className="h-8 w-8 text-accent flex-shrink-0" />}
            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-accent text-primary' : 'bg-primary'}`}>
              {msg.parts.map((part, partIndex) => (
                <div key={partIndex}>
                  {part.image && <img src={part.image} alt="user upload" className="rounded-md max-w-xs mb-2" />}
                  <p className="whitespace-pre-wrap">{part.text}</p>
                </div>
              ))}
            </div>
            {msg.role === 'user' && <UserCircleIcon className="h-8 w-8 text-text-secondary flex-shrink-0" />}
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
          <div className="flex items-start gap-3">
             <AcademicCapIcon className="h-8 w-8 text-accent" />
             <div className="max-w-lg p-3 rounded-lg bg-primary">
               <Spinner />
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      <div className="p-4 border-t border-primary">
         {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
         {imagePreview && (
          <div className="relative inline-block mb-2">
            <img src={imagePreview} alt="preview" className="h-20 w-20 object-cover rounded-md" />
            <button onClick={removeImage} className="absolute top-0 right-0 -mt-2 -mr-2 bg-primary rounded-full p-0.5">
              <XMarkIcon className="h-4 w-4 text-text-primary" />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-md hover:bg-primary">
            <PaperClipIcon className="h-6 w-6 text-text-secondary" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*"/>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or upload an image of a problem..."
            className="flex-1 bg-primary border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || (!input.trim() && !image)}>
            {isLoading ? <Spinner /> : <PaperAirplaneIcon className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AITutor;
