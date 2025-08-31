import React from "react";



export const Component = () => {
  return (
<div id="webcrumbs"> 
        	<div className="bg-neutral-950 min-h-screen text-neutral-50">
	  {/* Header */}
	  <header className="py-6 px-8 md:px-16 lg:px-24 flex justify-between items-center border-b border-neutral-800">
	    <div className="flex items-center gap-2">
	      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
	        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
	        <path  d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
	      </svg>
	      <h1 className="font-bold text-2xl tracking-tighter">XENIA</h1>
	    </div>
	    <nav className="hidden md:flex items-center gap-8">
	      <a  href="#features" className="text-sm font-medium hover:text-primary-400 transition-all">Features</a>
	      <a href="#how-it-works" className="text-sm font-medium hover:text-primary-400 transition-all">How it Works</a>
	      <a href="#pricing" className="text-sm font-medium hover:text-primary-400 transition-all">Pricing</a>
	      <a href="#faq" className="text-sm font-medium hover:text-primary-400 transition-all">FAQ</a>
	    </nav>
	    <div className="flex items-center gap-4">
	      <a href="/login" className="text-sm font-medium hover:text-primary-400 transition-all">Log in</a>
	      <a href="/register" className="bg-primary-600 text-neutral-50 px-4 py-2 text-sm font-medium rounded-md hover:bg-primary-500 transition-all">Sign up</a>
	    </div>
	  </header>
	
	  {/* Hero Section */}
	  <section className="py-24 px-8 md:px-16 lg:px-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
	    <div className="space-y-8">
	      <div className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-800 text-xs font-medium">
	        AI-Powered Education
	      </div>
	      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight">
	        Your Personal 
	        <span className="text-primary-500 relative ml-2">
	          AI Study
	          <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 180 8" fill="none" xmlns="http://www.w3.org/2000/svg">
	            <path d="M1 5.5C36.5 2 72 1 180 6.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
	          </svg>
	        </span> 
	        <br/>Planner
	      </h1>
	      <p className="text-lg text-neutral-400 max-w-md">
	        Generate personalized study plans, get help from AI tutors, and track your progress with powerful analytics.
	      </p>
	      <div className="flex flex-col sm:flex-row gap-4">
	        <a href="/register" className="bg-primary-600 text-neutral-50 px-6 py-3 font-medium rounded-md hover:bg-primary-500 transition-all text-center">
	          Get Started Free
	        </a>
	        <a href="#how-it-works" className="border border-neutral-700 px-6 py-3 font-medium rounded-md hover:bg-neutral-800 transition-all text-center">
	          See How It Works
	        </a>
	      </div>
	      <div className="flex items-center gap-4">
	        <div className="flex -space-x-2">
	          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwxfHx1c2VyfGVufDB8fHx8MTc1NjU5ODQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080" alt="User" className="w-8 h-8 rounded-full border-2 border-neutral-950" />
	          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwyfHx1c2VyfGVufDB8fHx8MTc1NjU5ODQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080" alt="User" className="w-8 h-8 rounded-full border-2 border-neutral-950" />
	          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwzfHx1c2VyfGVufDB8fHx8MTc1NjU5ODQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080" alt="User" className="w-8 h-8 rounded-full border-2 border-neutral-950" />
	        </div>
	        <p className="text-sm text-neutral-400">Trusted by 10,000+ students worldwide</p>
	      </div>
	    </div>
	    <div className="relative">
	      <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-900 rounded-full opacity-20 blur-3xl"></div>
	      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg p-6 transform transition-all hover:scale-[1.02]">
	        <div className="flex justify-between items-center mb-6">
	          <h3 className="text-lg font-bold">Today's Study Plan</h3>
	          <span className="text-sm font-medium bg-green-900 text-green-300 px-2 py-1 rounded-md">On Track</span>
	        </div>
	        <div className="space-y-4">
	          <div className="bg-neutral-800 p-4 rounded-lg">
	            <div className="flex justify-between items-center mb-2">
	              <h4 className="font-medium">Organic Chemistry</h4>
	              <span className="text-xs text-neutral-400">45 min</span>
	            </div>
	            <div className="w-full bg-neutral-700 h-2 rounded-full">
	              <div className="bg-primary-500 h-2 rounded-full" style={{width: '60%'}}></div>
	            </div>
	          </div>
	          <div className="bg-neutral-800 p-4 rounded-lg">
	            <div className="flex justify-between items-center mb-2">
	              <h4 className="font-medium">Calculus - Derivatives</h4>
	              <span className="text-xs text-neutral-400">30 min</span>
	            </div>
	            <div className="w-full bg-neutral-700 h-2 rounded-full">
	              <div className="bg-primary-500 h-2 rounded-full" style={{width: '30%'}}></div>
	            </div>
	          </div>
	          <div className="bg-neutral-800 p-4 rounded-lg">
	            <div className="flex justify-between items-center mb-2">
	              <h4 className="font-medium">Physics - Kinematics</h4>
	              <span className="text-xs text-neutral-400">60 min</span>
	            </div>
	            <div className="w-full bg-neutral-700 h-2 rounded-full">
	              <div className="bg-primary-500 h-2 rounded-full" style={{width: '0%'}}></div>
	            </div>
	          </div>
	        </div>
	        <button className="w-full mt-6 border border-neutral-700 px-4 py-3 rounded-md font-medium hover:bg-neutral-800 transition-all">
	          View Full Plan
	        </button>
	      </div>
	    </div>
	  </section>
	
	  {/* Features Section */}
	  <section id="features" className="py-24 px-8 md:px-16 lg:px-24">
	    <div className="text-center mb-16">
	      <h2 className="text-4xl font-bold tracking-tighter mb-4">Key Features</h2>
	      <p className="text-neutral-400 max-w-2xl mx-auto">
	        XENIA combines artificial intelligence with proven learning techniques to help you study smarter, not harder.
	      </p>
	    </div>
	
	    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
	      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <div className="w-12 h-12 bg-primary-900 rounded-full flex items-center justify-center mb-4">
	          <span className="material-symbols-outlined text-primary-400">calendar_month</span>
	        </div>
	        <h3 className="text-xl font-bold mb-2">Personalized Study Planner</h3>
	        <p className="text-neutral-400">
	          AI-generated study schedules based on your syllabus, assessment results, and learning patterns.
	        </p>
	      </div>
	
	      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <div className="w-12 h-12 bg-primary-900 rounded-full flex items-center justify-center mb-4">
	          <span className="material-symbols-outlined text-primary-400">smart_toy</span>
	        </div>
	        <h3 className="text-xl font-bold mb-2">AI Tutor</h3>
	        <p className="text-neutral-400">
	          Get instant help with difficult concepts, solve doubts with OCR support, and receive targeted recommendations.
	        </p>
	      </div>
	
	      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <div className="w-12 h-12 bg-primary-900 rounded-full flex items-center justify-center mb-4">
	          <span className="material-symbols-outlined text-primary-400">quiz</span>
	        </div>
	        <h3 className="text-xl font-bold mb-2">Assessments</h3>
	        <p className="text-neutral-400">
	          Upload your test results to identify knowledge gaps and automatically adjust your study plan.
	        </p>
	      </div>
	
	      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <div className="w-12 h-12 bg-primary-900 rounded-full flex items-center justify-center mb-4">
	          <span className="material-symbols-outlined text-primary-400">analytics</span>
	        </div>
	        <h3 className="text-xl font-bold mb-2">Progress Analytics</h3>
	        <p className="text-neutral-400">
	          Visualize your learning journey with intuitive charts, mastery heatmaps, and performance insights.
	        </p>
	      </div>
	
	      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <div className="w-12 h-12 bg-primary-900 rounded-full flex items-center justify-center mb-4">
	          <span className="material-symbols-outlined text-primary-400">military_tech</span>
	        </div>
	        <h3 className="text-xl font-bold mb-2">Gamification</h3>
	        <p className="text-neutral-400">
	          Stay motivated with XP, levels, achievements, and streaks that make studying more engaging.
	        </p>
	      </div>
	
	      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <div className="w-12 h-12 bg-primary-900 rounded-full flex items-center justify-center mb-4">
	          <span className="material-symbols-outlined text-primary-400">groups</span>
	        </div>
	        <h3 className="text-xl font-bold mb-2">Teacher & Parent Support</h3>
	        <p className="text-neutral-400">
	          Allow teachers to tag weak topics and share progress reports with parents for comprehensive support.
	        </p>
	      </div>
	    </div>
	  </section>
	
	  {/* Testimonials */}
	  <section className="py-24 px-8 md:px-16 lg:px-24 bg-neutral-900">
	    <div className="text-center mb-16">
	      <h2 className="text-4xl font-bold tracking-tighter mb-4">What Students Say</h2>
	      <p className="text-neutral-400 max-w-2xl mx-auto">
	        Hear from students who have transformed their study habits with XENIA.
	      </p>
	    </div>
	
	    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
	      <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <div className="flex items-center gap-2 mb-2">
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	        </div>
	        <p className="text-lg mb-6">"XENIA helped me organize my study time and focus on my weak areas. I improved my grades by 15% in just one semester!"</p>
	        <div className="flex items-center gap-4">
	          <img src="https://images.unsplash.com/photo-1614544048536-0d28caf77f41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwxfHxzYXJhaCUyMGoufGVufDB8fHx8MTc1NjY0MzE3Nnww&ixlib=rb-4.1.0&q=80&w=1080" alt="Sarah J." className="w-12 h-12 rounded-full" />
	          <div>
	            <h4 className="font-bold">Sarah J.</h4>
	            <p className="text-sm text-neutral-400">Medical Student</p>
	          </div>
	        </div>
	      </div>
	
	      <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <div className="flex items-center gap-2 mb-2">
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	        </div>
	        <p className="text-lg mb-6">"The AI tutor is like having a personal teacher available 24/7. It explains difficult concepts in a way I can understand."</p>
	        <div className="flex items-center gap-4">
	          <img  src="https://images.unsplash.com/photo-1620477403960-4188fdd7cee0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwxfHxtaWNoYWVsJTIwdC58ZW58MHx8fHwxNzU2NjQzMTc3fDA&ixlib=rb-4.1.0&q=80&w=1080" alt="Michael T." className="w-12 h-12 rounded-full" />
	          <div>
	            <h4 className="font-bold">Michael T.</h4>
	            <p className="text-sm text-neutral-400">High School Student</p>
	          </div>
	        </div>
	      </div>
	
	      <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <div className="flex items-center gap-2 mb-2">
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	          <span className="text-yellow-400">★</span>
	        </div>
	        <p className="text-lg mb-6">"As a teacher, I can see which topics my students struggle with and provide targeted help. XENIA has transformed my classroom."</p>
	        <div className="flex items-center gap-4">
	          <img src="https://images.unsplash.com/photo-1741880295874-72b665807375?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwxfHxsaW5kYSUyMG0ufGVufDB8fHx8MTc1NjY0MzE3OHww&ixlib=rb-4.1.0&q=80&w=1080" alt="Linda M." className="w-12 h-12 rounded-full" />
	          <div>
	            <h4 className="font-bold">Linda M.</h4>
	            <p className="text-sm text-neutral-400">Physics Teacher</p>
	          </div>
	        </div>
	      </div>
	    </div>
	  </section>
	
	  {/* How it Works */}
	  <section  id="how-it-works" className="py-24 px-8 md:px-16 lg:px-24">
	    <div className="text-center mb-16">
	      <h2 className="text-4xl font-bold tracking-tighter mb-4">How XENIA Works</h2>
	      <p  className="text-neutral-400 max-w-2xl mx-auto">
	        A simple four-step process to transform your learning experience.
	      </p>
	    </div>
	
	    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
	      <div className="text-center">
	        <div className="w-16 h-16 bg-primary-600 text-neutral-50 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 hover:bg-primary-500 transition-all">1</div>
	        <h3 className="text-xl font-bold mb-2">Upload Your Syllabus</h3>
	        <p className="text-neutral-400">
	          Start by uploading your course materials and setting your exam dates.
	        </p>
	      </div>
	
	      <div className="text-center">
	        <div className="w-16 h-16 bg-primary-600 text-neutral-50 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 hover:bg-primary-500 transition-all">2</div>
	        <h3  className="text-xl font-bold mb-2">Complete Assessments</h3>
	        <p className="text-neutral-400">
	          Take initial assessments to identify your strengths and weaknesses.
	        </p>
	      </div>
	
	      <div  className="text-center">
	        <div className="w-16 h-16 bg-primary-600 text-neutral-50 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 hover:bg-primary-500 transition-all">3</div>
	        <h3 className="text-xl font-bold mb-2">Follow Your Plan</h3>
	        <p className="text-neutral-400">
	          Get a personalized study schedule that adapts to your progress.
	        </p>
	      </div>
	
	      <div className="text-center">
	        <div className="w-16 h-16 bg-primary-600 text-neutral-50 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 hover:bg-primary-500 transition-all">4</div>
	        <h3 className="text-xl font-bold mb-2">Track & Improve</h3>
	        <p className="text-neutral-400">
	          Monitor your progress and adjust your approach based on insights.
	        </p>
	      </div>
	    </div>
	
	    <div className="mt-16 bg-neutral-900 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
	      <div className="md:w-1/2">
	        <h3 className="text-2xl font-bold mb-4">See XENIA in Action</h3>
	        <p className="text-neutral-400 mb-6">
	          Watch a quick demo of how XENIA can revolutionize your study routine and help you achieve your academic goals.
	        </p>
	        <button className="bg-primary-600 text-neutral-50 px-6 py-3 font-medium rounded-md hover:bg-primary-500 transition-all flex items-center gap-2">
	          <span className="material-symbols-outlined">play_circle</span>
	          Watch Demo
	        </button>
	      </div>
	      <div className="md:w-1/2 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 shadow-lg">
	        <img src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" alt="XENIA Demo" className="w-full h-64 object-cover" keywords="study planner, student dashboard, AI education app" />
	      </div>
	    </div>
	  </section>
	
	  {/* Pricing */}
	  <section id="pricing" className="py-24 px-8 md:px-16 lg:px-24 bg-neutral-900">
	    <div className="text-center mb-16">
	      <h2 className="text-4xl font-bold tracking-tighter mb-4">Simple Pricing</h2>
	      <p  className="text-neutral-400 max-w-2xl mx-auto">
	        Choose the plan that works best for your learning journey.
	      </p>
	    </div>
	
	    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
	      <div className="bg-neutral-800 rounded-2xl border border-neutral-700 p-8 hover:shadow-lg transition-all hover:translate-y-[-4px]">
	        <h3 className="text-2xl font-bold mb-2">Free</h3>
	        <p className="text-neutral-400 mb-6">Perfect for getting started</p>
	        <div className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal text-neutral-400">/month</span></div>
	        <ul className="space-y-4 mb-8">
	          <li className="flex items-center gap-2">
	            <span className="material-symbols-outlined text-green-500">check_circle</span>
	            <span>Basic study planner</span>
	          </li>
	          <li className="flex items-center gap-2">
	            <span className="material-symbols-outlined text-green-500">check_circle</span>
	            <span>Limited AI tutor interactions</span>
	          </li>
	          </ul></div></div></section></div> 
        </div>
  )
}

