/**
 * @module data/scripts
 * Predefined dialogue scripts for Script Based mode.
 * Each script contains alternating AI/user lines for practice.
 * Add new scripts here — no other file changes needed.
 */

export const SCRIPTS = [
  {
    id: 'coffee-shop',
    title: 'At the Coffee Shop',
    description: 'Order your favorite drink and chat with the barista',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    lines: [
      { role: 'ai',   text: "Good morning! What can I get for you today?" },
      { role: 'user', text: "Hi! I'd like a large latte, please." },
      { role: 'ai',   text: "Sure! Would you like any flavor syrup with that?" },
      { role: 'user', text: "Yes, vanilla please. And can I get it to go?" },
      { role: 'ai',   text: "Of course! That'll be $5.50. Can I get a name for the order?" },
      { role: 'user', text: "It's Alex. Thanks!" },
    ],
  },
  {
    id: 'job-interview',
    title: 'Job Interview',
    description: 'Practice common interview questions and professional responses',
    difficulty: 'intermediate',
    estimatedMinutes: 10,
    lines: [
      { role: 'ai',   text: "Good afternoon, please have a seat. Tell me a bit about yourself." },
      { role: 'user', text: "Thank you for having me. I'm a software developer with five years of experience." },
      { role: 'ai',   text: "Interesting! What made you apply for this position?" },
      { role: 'user', text: "I've been following your company for a while and I'm impressed by your work on AI products." },
      { role: 'ai',   text: "That's great to hear. Can you tell me about a challenging project you've worked on?" },
      { role: 'user', text: "Sure. I led a team that built a real-time data pipeline processing millions of events per day." },
      { role: 'ai',   text: "Impressive. Where do you see yourself in five years?" },
      { role: 'user', text: "I'd like to grow into a technical lead role, mentoring junior developers and driving architecture decisions." },
    ],
  },
  {
    id: 'travel-directions',
    title: 'Asking for Directions',
    description: 'Navigate an unfamiliar city with confidence',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    lines: [
      { role: 'user', text: "Excuse me, could you help me find the nearest metro station?" },
      { role: 'ai',   text: "Sure! Go straight for two blocks, then turn left at the traffic lights." },
      { role: 'user', text: "And how far is it from here?" },
      { role: 'ai',   text: "About a ten-minute walk. You can't miss the big red sign." },
    ],
  },
  {
    id: 'doctor-visit',
    title: 'Doctor Appointment',
    description: 'Describe symptoms and understand medical advice',
    difficulty: 'intermediate',
    estimatedMinutes: 8,
    lines: [
      { role: 'ai',   text: "Hello, what seems to be the problem today?" },
      { role: 'user', text: "I've had a headache for three days and I feel quite tired." },
      { role: 'ai',   text: "I see. Any fever or nausea along with that?" },
      { role: 'user', text: "A slight fever, around 37.5 degrees, but no nausea." },
      { role: 'ai',   text: "Alright. I'll prescribe some medication. Make sure to rest and drink plenty of fluids." },
      { role: 'user', text: "Thank you, doctor. Should I come back for a follow-up?" },
    ],
  },
  {
    id: 'restaurant-reservation',
    title: 'Restaurant Reservation',
    description: 'Make and modify a restaurant booking over the phone',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    lines: [
      { role: 'ai',   text: "Thank you for calling La Maison. How can I help you?" },
      { role: 'user', text: "Hi, I'd like to make a reservation for two people this Saturday evening." },
      { role: 'ai',   text: "Of course! What time would you prefer?" },
      { role: 'user', text: "Around 7:30 PM, if possible." },
      { role: 'ai',   text: "We have a table available at 7:30. Can I have your name, please?" },
      { role: 'user', text: "It's Sarah Johnson. Thank you!" },
    ],
  },
  {
    id: 'cto-hr-second-interview',
    title: 'CTO + HR Second Interview',
    description: 'Practice a senior Laravel/PHP interview with technical, AI, and HR questions',
    difficulty: 'advanced',
    estimatedMinutes: 15,
    lines: [
      { role: 'ai',   text: "Thanks for joining us today. Could you start by telling us a bit about yourself?" },
      { role: 'user', text: "I've been working mainly with Laravel and backend systems for several years. Over time I also became more involved in infrastructure, Docker, AWS, Redis, and scalable architecture decisions." },
      { role: 'ai',   text: "What kind of systems have you worked on, and what level of ownership did you have?" },
      { role: 'user', text: "I've worked on high-traffic and integration-heavy systems. My role usually included backend design, performance improvements, production support, and ownership of delivery quality." },
      { role: 'ai',   text: "When do you use service or repository patterns in Laravel?" },
      { role: 'user', text: "I try to keep things simple first. I use service classes when business logic starts growing, and I use repositories when data access becomes complex or needs a clear abstraction for testing or multiple sources." },
      { role: 'ai',   text: "How do you approach scalability and common performance problems in Laravel applications?" },
      { role: 'user', text: "I start with measurement, then optimize the real bottlenecks. In practice that usually means query optimization, caching, queueing heavy work, reducing N+1 issues, and reviewing slow external integrations." },
      { role: 'ai',   text: "How do you use queues, jobs, and events in production systems?" },
      { role: 'user', text: "I use queues for tasks that should not block the request cycle, like emails, webhooks, file processing, and third-party sync jobs. Events are useful when I want to keep modules loosely coupled without overcomplicating the flow." },
      { role: 'ai',   text: "AI-assisted engineering is important for this role. How do you use AI tools in your daily workflow?" },
      { role: 'user', text: "AI is not just autocomplete for me. I use it as an engineering acceleration layer for refactoring, documentation, test generation, architecture brainstorming, and navigating large codebases, but I still validate design and code quality myself." },
      { role: 'ai',   text: "How do you make sure AI-generated code does not introduce bad decisions or hidden bugs?" },
      { role: 'user', text: "I treat AI output like junior-level draft code. I review logic carefully, compare it with existing conventions, test edge cases, and check whether it actually fits the production constraints before I keep any of it." },
      { role: 'ai',   text: "How do you work with teams, especially when there are disagreements or developers who need support?" },
      { role: 'user', text: "I prefer calm and direct communication. I enjoy mentoring, improving engineering standards, and discussing tradeoffs openly. If there is disagreement, I try to align on facts, constraints, and what is best for the product." },
      { role: 'ai',   text: "Why are you interested in this role, and what are you looking for next?" },
      { role: 'user', text: "I'm looking for a role where I can contribute with strong backend ownership, practical architecture thinking, and a modern AI-assisted workflow. This position stands out because it seems to value both technical depth and real execution." },
      { role: 'ai',   text: "What are your salary expectations, and how do you think about long-term alignment?" },
      { role: 'user', text: "Considering the responsibilities and contractor nature of the role, I'd currently be comfortable around GBP 4.5K to 5.5K per month. Long term, I'd definitely be open to UK alignment if there is mutual fit." },
    ],
  },
];

export default SCRIPTS;
