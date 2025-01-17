# Pairsona (MBTI-Based User Matching App)

## Overview

This is the backend for `Pairsona`, a platform that matches users based on their Myers-Briggs Type Indicator (MBTI) personality types. The app provides compatibility insights and enables user interactions such as connection requests and messaging. The goal is to foster meaningful new encounters and relationships.

## Deployment

Visit [Pairsona](https://pairsona-frontend.onrender.com)

---

### **Running Locally In Development**

**Starting up backend:**

- Navigate to backend directory `cd backend`
- Install dependencies `npm i`
- Run `npm start`

**Note**: Before running the backend locally, make sure to set up the necessary `.env` file with API keys

---

### **Repositories**

- [Frontend](https://github.com/jensuki/Pairsona-frontend)
- [Backend](https://github.com/jensuki/Pairsona-backend)

---

### **Functionality**

- **Generate Compatible Users**: Recommend users based on MBTI compatibility and geographic proximity.
- **Compatibility Insights**: Display brief compatibility descriptions for different MBTI type pairings.
- **User Interactions**:
  - Send, accept, or decline connection requests.
  - One-on-one messaging for connected users.
  - Option to remove connections.

---

### **User Flow**

1. **Sign Up**: Users register with their basic details.
2. **MBTI Quiz**: Users complete a quiz to determine their MBTI type.
3. **View Matches**: Potential matches are shown based on:
   - MBTI compatibility.
   - Closest geographic proximity (using latitude and longitude).
4. **Connect & Chat**:
   - Send connection requests.
   - Accept or decline requests.
   - Message connected users.
   - Remove connections if desired.

---


