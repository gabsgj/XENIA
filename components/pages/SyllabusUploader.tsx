
import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { analyzeSyllabusText, findWeakTopics, generateStudyPlan } from '../../services/geminiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { Topic } from '../../types';
import { DocumentArrowUpIcon, PhotoIcon, SparklesIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';


const SyllabusUploader: React.FC = () => {
  const { setSyllabus, setStudyPlan, isLoading, setIsLoading, error, setError, syllabus } = useAppContext();
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [assessmentImage, setAssessmentImage] = useState<File | null>(null);
  const [weakTopics, setWeakTopics] = useState<Topic[] | null>(null);
  const navigate = useNavigate();

  const handleSyllabusUpload = async () => {
    if (!syllabusFile) {
      setError("Please select a syllabus file first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const text = await syllabusFile.text();
      const analyzedSyllabus = await analyzeSyllabusText(text);
      setSyllabus(analyzedSyllabus);
    } catch (e: any) {
      setError(e.message || "Failed to analyze syllabus.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeaknessAnalysis = async () => {
    if (!assessmentImage || !syllabus) {
        setError("Please upload syllabus and an assessment image.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const topics = await findWeakTopics(assessmentImage, syllabus);
        setWeakTopics(topics);
    } catch (e: any) {
        setError(e.message || "Failed to analyze weaknesses.");
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handlePlanGeneration = async () => {
      if (!weakTopics) {
        setError("Please analyze weaknesses first.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const plan = await generateStudyPlan(weakTopics);
        setStudyPlan(plan);
        navigate('/plan');
      } catch (e: any) {
        setError(e.message || "Failed to generate study plan.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
  };
  
  const FileInput = ({ icon: Icon, label, file, setFile, accept }: { icon: React.ElementType, label: string, file: File | null, setFile: (f: File | null) => void, accept: string }) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-600 rounded-md">
        <div className="space-y-1 text-center">
          <Icon className="mx-auto h-12 w-12 text-gray-500" />
          {file ? (
            <p className="text-text-primary">{file.name}</p>
          ) : (
            <div className="flex text-sm text-gray-400">
              <label htmlFor={label} className="relative cursor-pointer bg-primary rounded-md font-medium text-accent hover:text-sky-300 focus-within:outline-none">
                <span>Upload a file</span>
                <input id={label} name={label} type="file" className="sr-only" onChange={e => setFile(e.target.files?.[0] || null)} accept={accept} />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
          )}
          <p className="text-xs text-gray-500">{accept === ".txt" ? "TXT up to 1MB" : "PNG, JPG up to 5MB"}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Get Started</h1>
      <p className="text-text-secondary">Upload your course materials to generate a personalized study plan.</p>
      
      {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-2" />{error}</div>}

      <Card>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-semibold">1. Upload Syllabus</h2>
            <FileInput icon={DocumentArrowUpIcon} label="Syllabus File" file={syllabusFile} setFile={setSyllabusFile} accept=".txt" />
            <Button onClick={handleSyllabusUpload} disabled={isLoading || !syllabusFile}>
              {isLoading && !syllabus ? <Spinner /> : "Analyze Syllabus"}
            </Button>
          </div>
          {syllabus && (
            <div className="flex-1 space-y-4">
              <h2 className="text-xl font-semibold">2. Analyze Weaknesses</h2>
              <FileInput icon={PhotoIcon} label="Assessment Image" file={assessmentImage} setFile={setAssessmentImage} accept="image/png, image/jpeg" />
              <Button onClick={handleWeaknessAnalysis} disabled={isLoading || !assessmentImage}>
                {isLoading && !weakTopics ? <Spinner /> : "Find Weak Spots"}
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {weakTopics && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Identified Weak Topics</h2>
          <ul className="space-y-2 list-disc list-inside text-text-secondary">
              {weakTopics.map(topic => <li key={topic.topicName}>{topic.topicName}</li>)}
          </ul>
          <div className="mt-6 flex justify-center">
            <Button onClick={handlePlanGeneration} disabled={isLoading}>
                {isLoading ? <Spinner /> : <><SparklesIcon className="h-5 w-5 mr-2"/>Generate My Study Plan</>}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SyllabusUploader;
