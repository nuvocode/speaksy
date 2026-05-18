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
];

export default SCRIPTS;
