import axios from "axios";

export async function generateQuiz({ user_id, topics, num_questions, options_count, duration, user_profile, syllabus }: {
  user_id: string;
  topics: string[];
  num_questions: number;
  options_count: number;
  duration: number;
  user_profile?: string;
  syllabus?: string;
}) {
  const resp = await axios.post("/api/quiz/generate", {
    user_id,
    topics,
    num_questions,
    options_count,
    duration,
    user_profile,
    syllabus,
  });
  return resp.data.quiz;
}

export async function submitQuiz({ quiz, user_answers }: {
  quiz: any;
  user_answers: number[];
}) {
  const resp = await axios.post("/api/quiz/submit", {
    quiz,
    user_answers,
  });
  return resp.data.stats;
}
