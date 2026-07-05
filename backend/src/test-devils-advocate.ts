import { mastra } from './mastra/index.js';

async function main() {
  const startupDescription = `
    Startup Name: PetStream
    One-line pitch: "Uber for Pet Grooming"
    Description: An on-demand mobile application that connects busy pet owners with certified, mobile pet groomers. 
    Owners can request grooming services (bath, trim, nail clipping) at their doorstep. 
    Our custom-built vans drive to the customer's house to perform the grooming.
    Monetization: We take a 20% commission on every grooming job, and charge a premium convenience fee for same-day bookings.
    GTM: Social media ads targeting high-income dog owners in major city centers (San Francisco, NY).
    Team: 2 co-founders (one ex-software engineer at Airbnb, one veterinary clinic manager).
  `.trim();

  console.log('\n[Test Runner] Target Startup for Devil\'s Advocate Test:');
  console.log('--------------------------------------------------');
  console.log(startupDescription);
  console.log('--------------------------------------------------\n');

  const googleKey = process.env.GOOGLE_API_KEY;
  const hasRealKey = googleKey && googleKey !== 'your_google_api_key_here';

  if (!hasRealKey) {
    console.log('[Warning] GOOGLE_API_KEY is not set in .env. Showing mock Devil\'s Advocate questions...');
    console.log('\n================ MOCK DEVIL\'S ADVOCATE QUESTIONS ================');
    console.log(`
1. Groomer Utilization Risk:
   - Context: Since you are operating custom-built vans, your capital expenditure (CapEx) is very high compared to a pure software marketplace. How will you keep van and groomer utilization high enough during weekdays to cover lease and depreciation costs?
   
2. Customer Acquisition Cost (CAC) vs. LTV:
   - Context: Grooming is typically a recurring but low-frequency service (every 6-8 weeks). If your acquisition is heavily dependent on social media ads in high-income, competitive areas, how do you prevent CAC from exceeding the lifetime value of a pet owner?
   
3. Geographic Scalability:
   - Context: Scaling a physical fleet of custom vans city-by-city is operationally complex and capital intensive. How do you plan to achieve rapid market penetration without burning through venture funding on logistics?
   
4. Retention and Disintermediation:
   - Context: If a customer finds a groomer they love through PetStream, what stops them from taking the transaction offline to avoid your 20% commission fee?
   
5. Supply Constraints:
   - Context: Certified pet groomers are in high demand and short supply. How will you attract and retain top-tier groomers on your platform when independent groomers can set up their own clienteles without paying platform fees?
    `.trim());
    console.log('=================================================================\n');
    console.log('[Success] DevilsAdvocateAgent setup is complete and ready to execute once GOOGLE_API_KEY is added!');
  } else {
    console.log('[Test Runner] GOOGLE_API_KEY is configured. Invoking DevilsAdvocateAgent...');
    try {
      const agent = mastra.getAgent('devilsAdvocateAgent');
      const response = await agent.generate(
        `Review the following startup pitch and generate 10 to 15 critical, brutal investor questions. Highlight the risks and assumptions. Startup detail:\n\n${startupDescription}`
      );
      console.log('\n================ DEVIL\'S ADVOCATE QUESTIONS ================');
      console.log(response.text);
      console.log('============================================================\n');
      console.log('[Success] DevilsAdvocateAgent generated questions successfully!');
    } catch (error) {
      console.error('[Error] DevilsAdvocateAgent execution failed:', error);
    }
  }
}

main();
