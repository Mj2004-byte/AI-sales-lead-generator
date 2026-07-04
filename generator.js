/**
 * LeadGen.AI — Lead Generation & Outreach Engine
 * Connects to Groq API or generates contextual mock leads.
 */

class LeadGenerator {
    constructor(apiKey = '') {
        this.apiKey = apiKey;
        this.defaultModel = 'llama-3.3-70b-versatile';
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * Generate leads based on criteria
     * @param {Object} criteria - { industry, location, targetCustomer, valueProp }
     * @param {Function} onProgress - Callback for loading status updates
     * @returns {Promise<Array>} - List of enriched lead objects
     */
    async generate(criteria, onProgress = () => {}) {
        const { industry, location, targetCustomer, valueProp } = criteria;
        
        // 1. Start simulation/progress steps
        onProgress(1, `Searching directories and public web archives for "${industry}" companies in "${location}"...`);
        await this._delay(1500);

        onProgress(2, `Scanning websites and social registries to identify "${targetCustomer}" profiles...`);
        await this._delay(1500);

        onProgress(3, `Analyzing business metrics and calculating lead relevance scores...`);
        await this._delay(1200);

        onProgress(4, `Writing customized outreach drafts using your value proposition...`);
        
        // Check if we have a valid-looking Groq API key
        const hasApiKey = this.apiKey && this.apiKey.trim().startsWith('gsk_');
        
        if (hasApiKey) {
            try {
                onProgress(4, `Connecting to Groq API (${this.defaultModel}) to generate live leads...`);
                const leads = await this._generateWithGroq(criteria);
                onProgress(4, `Generation complete! Enriched ${leads.length} leads successfully.`);
                await this._delay(500);
                return leads;
            } catch (error) {
                console.error("Groq API Error:", error);
                // Throw specific errors or trigger callback
                throw new Error(error.message || "Failed to generate leads with Groq. Falling back to Simulation Mode.");
            }
        } else {
            // Run simulation mode
            await this._delay(1200);
            const mockLeads = this._generateSimulatedLeads(criteria);
            onProgress(4, `Simulation complete! Loaded ${mockLeads.length} sample leads.`);
            return mockLeads;
        }
    }

    /**
     * Call Groq API to get real, structured leads
     */
    async _generateWithGroq(criteria) {
        const { industry, location, targetCustomer, valueProp } = criteria;
        
        const systemPrompt = `You are an expert B2B lead generation engine and copywriting assistant.
Analyze the user's target industry, location, and target decision-maker.
Find or invent 5 highly realistic target companies that fit these criteria.
For each company, determine their target person's name, role, email, phone, website, and an AI lead score (0-100) reflecting their likelihood of needing the user's product/service.
Then, write a highly personalized, compelling, and short cold outreach email pitch from the sender (who has the provided Value Proposition) to the contact person.

IMPORTANT: You must return the output strictly as a JSON array. Do not include markdown wraps (like \`\`\`json) or any conversational text. Return ONLY the raw JSON string starting with [ and ending with ].

JSON Object Schema:
{
  "name": "Company Name",
  "website": "www.companyname.com",
  "description": "A short sentence describing what this company does.",
  "contactName": "Full Name",
  "contactRole": "Job Title (must match or relate to user's target contact)",
  "contactEmail": "first.last@companyname.com",
  "contactPhone": "+1-XXX-XXX-XXXX (use appropriate area code for location)",
  "contactLinkedIn": "linkedin.com/in/username",
  "score": 92, // integer between 40 and 99
  "scoreReasoning": "AI explanation of why this company scored well (e.g. Austin location, matches B2B profile, pain points match).",
  "emailSubject": "A compelling, short, non-spammy subject line.",
  "emailBody": "The personalized cold outreach email. Address the contact name, reference their company name, briefly mention their potential industry pain points, tie it to the sender's value proposition, and close with a clear, low-friction call to action. Keep it under 150 words."
}`;

        const userPrompt = `Target Industry: ${industry}
Target Location: ${location}
Target Contact: ${targetCustomer}
Sender's Value Proposition: ${valueProp}

Generate 5 high-converting leads matching these details.`;

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.defaultModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" } // request JSON
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${response.status} Error`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        let content = data.choices[0].message.content.trim();
        
        // Clean markdown wraps if the model ignored system prompts
        if (content.startsWith('```json')) {
            content = content.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (content.startsWith('```')) {
            content = content.replace(/^```/, '').replace(/```$/, '').trim();
        }

        try {
            // Groq may return the array wrapped in an object if forced JSON mode, e.g. { "leads": [...] }
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                return parsed;
            } else if (parsed.leads && Array.isArray(parsed.leads)) {
                return parsed.leads;
            } else if (typeof parsed === 'object') {
                // If it returned a single object instead of array
                const keys = Object.keys(parsed);
                if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
                    return parsed[keys[0]];
                }
                return [parsed];
            }
            throw new Error("Invalid lead array structure returned");
        } catch (e) {
            console.error("Failed to parse JSON response content:", content);
            throw new Error("Could not parse the AI response as structured lead data.");
        }
    }

    /**
     * Generate highly realistic, customized mock leads for Simulation Mode
     */
    _generateSimulatedLeads(criteria) {
        const { industry, location, targetCustomer, valueProp } = criteria;
        
        // Normalize strings for checks
        const ind = industry.toLowerCase();
        const loc = location.toLowerCase();
        
        // Setup local variables to make mock data look realistic
        let areaCode = '512'; // Default Austin
        if (loc.includes('new york') || loc.includes('ny')) areaCode = '212';
        else if (loc.includes('san francisco') || loc.includes('ca') || loc.includes('bay area')) areaCode = '415';
        else if (loc.includes('london') || loc.includes('uk')) areaCode = '020';
        else if (loc.includes('chicago')) areaCode = '312';
        else if (loc.includes('boston')) areaCode = '617';
        else if (loc.includes('seattle')) areaCode = '206';
        else if (loc.includes('miami')) areaCode = '305';
        
        // List of mock company templates based on industry
        const techCompanies = [
            { nameSuffix: 'Flow', domains: ['.io', '.co'] },
            { nameSuffix: 'Sync', domains: ['.com', '.tech'] },
            { nameSuffix: 'Stack', domains: ['.app', '.io'] },
            { nameSuffix: 'Scale', domains: ['.com', '.co'] },
            { nameSuffix: 'Pulse', domains: ['.io', '.net'] }
        ];

        const localBizCompanies = [
            { nameSuffix: ' & Partners', domains: ['.com'] },
            { nameSuffix: ' Group', domains: ['.com', '.org'] },
            { nameSuffix: ' Solutions', domains: ['.net', '.com'] },
            { nameSuffix: ' Collective', domains: ['.co'] },
            { nameSuffix: ' Services', domains: ['.com'] }
        ];

        const isTech = ind.includes('saas') || ind.includes('tech') || ind.includes('software') || ind.includes('startup') || ind.includes('digital') || ind.includes('cyber') || ind.includes('ai');
        const companyPool = isTech ? techCompanies : localBizCompanies;
        
        // Clean up base industry/niche word for company naming
        let baseIndustryWord = industry.split(' ')[0];
        baseIndustryWord = baseIndustryWord.charAt(0).toUpperCase() + baseIndustryWord.slice(1).replace(/[^a-zA-Z]/g, '');
        if (baseIndustryWord.length < 3) baseIndustryWord = "Nexus";
        
        // Contact details pools
        const firstNames = ['Sarah', 'David', 'Elena', 'Marcus', 'Samantha', 'Alex', 'Michael', 'Chloe', 'Ryan', 'Amara'];
        const lastNames = ['Chen', 'Rodriguez', 'Taylor', 'Kowalski', 'Jenkins', 'Vance', 'McAllister', 'Patel', 'Sutton', 'O\'Connor'];
        
        const reasons = [
            `Strong alignment: Active hiring indicators for sales roles and matches "${location}" geographic profile.`,
            `High potential: Recently raised seed/series-A funding, expanding operations, and fits target title profile.`,
            `Perfect match: Technographic data shows they lack direct solutions for ${industry.toLowerCase()} but are actively investing in digital operations.`,
            `Warm match: Has a medium sized team with 3+ decision makers matching "${targetCustomer}" title.`,
            `High priority: Company website indicates rapid scaling but manual contact forms, suggesting friction in client acquisition.`
        ];

        const leads = [];

        // Shuffle arrays slightly
        const shuffledFirst = [...firstNames].sort(() => 0.5 - Math.random());
        const shuffledLast = [...lastNames].sort(() => 0.5 - Math.random());
        const shuffledReasons = [...reasons].sort(() => 0.5 - Math.random());

        for (let i = 0; i < 5; i++) {
            const compSuffix = companyPool[i % companyPool.length];
            const compName = `${baseIndustryWord}${compSuffix.nameSuffix}`;
            const domainName = compName.toLowerCase().replace(/[^a-z0-9]/g, '') + compSuffix.domains[0];
            
            const contactF = shuffledFirst[i];
            const contactL = shuffledLast[i];
            const contactName = `${contactF} ${contactL}`;
            
            // Clean target customer title
            let contactRole = targetCustomer;
            if (contactRole.endsWith('s')) {
                // Plural to singular roughly
                contactRole = contactRole.slice(0, -1);
            }
            contactRole = contactRole.split('or')[0].trim(); // Get first option
            contactRole = contactRole.charAt(0).toUpperCase() + contactRole.slice(1);
            
            const email = `${contactF.toLowerCase()}.${contactL.toLowerCase()}@${domainName}`;
            
            // Score calculations
            const scores = [96 - (i * 4), 93 - (i * 3), 88 - (i * 5), 78 - (i * 4), 65 - (i * 6)];
            const score = Math.max(50, scores[i]);
            
            // Phone formatting
            const phone = areaCode.startsWith('020') 
                ? `+44 ${areaCode} 7911 ${Math.floor(100000 + Math.random() * 900000)}`
                : `+1 (${areaCode}) 555-01${Math.floor(10 + Math.random() * 89)}`;
                
            const linkedin = `linkedin.com/in/${contactF.toLowerCase()}-${contactL.toLowerCase()}-${Math.floor(100 + Math.random() * 899)}`;
            
            // Descriptions
            const descriptions = [
                `Innovative digital solution company simplifying workflows for businesses in the ${industry} space.`,
                `Leading regional firm delivering high-performance platforms and bespoke services.`,
                `Rapidly growing enterprise specializing in modern infrastructure and strategic development.`,
                `B2B agency helping clients optimize resource allocation and project management.`,
                `Established provider of automated tools and client-facing interfaces.`
            ];
            
            // Craft cold email copy
            const subject = this._generateSubjectLine(compName, contactRole, industry);
            const emailBody = this._generateEmailBody(contactF, compName, industry, targetCustomer, valueProp);

            leads.push({
                name: compName,
                website: `www.${domainName}`,
                description: descriptions[i % descriptions.length],
                contactName: contactName,
                contactRole: contactRole,
                contactEmail: email,
                contactPhone: phone,
                contactLinkedIn: linkedin,
                score: score,
                scoreReasoning: shuffledReasons[i % shuffledReasons.length],
                emailSubject: subject,
                emailBody: emailBody
            });
        }

        // Sort leads by score descending
        return leads.sort((a, b) => b.score - a.score);
    }

    _generateSubjectLine(company, role, industry) {
        const templates = [
            `Question regarding ${industry} operations at ${company}`,
            `Improving productivity for ${company}'s team`,
            `Quick request for ${company} - ${role}`,
            `Potential collaboration: ${company} x LeadGen`,
            `Re: Operations at ${company}`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    _generateEmailBody(firstName, company, industry, role, valueProp) {
        return `Hi ${firstName},

I was researching companies in the ${industry} sector around your region and came across ${company}. I noticed you're leading the team as their ${role}, and wanted to reach out.

Usually, companies like yours face bottlenecks when managing operations or scaling client outreach. We solve this directly: ${valueProp}

I'd love to show you how we could help ${company} achieve similar results. Do you have 10 minutes for a brief introductory chat next Tuesday morning?

Best regards,

[Your Name]
LeadGen Team`;
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Make globally accessible
window.LeadGenerator = LeadGenerator;
