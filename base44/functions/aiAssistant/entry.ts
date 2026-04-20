import Anthropic from 'npm:@anthropic-ai/sdk@0.24.3';

const client = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

const SYSTEM_PROMPT = `You are a friendly and helpful assistant for RE Jones Global, a housing organization that helps nonprofits and organizations place clients into transitional and supportive housing.

Your role is to:
1. Explain the referral process: How organizations can submit referrals for clients
2. Describe eligibility requirements for different housing programs
3. Explain the difference between per-bed placements and turnkey house leasing
4. Guide organizations through the partner application process
5. Provide information about available housing programs and capacity
6. Answer questions about our programs and services

Key Information:
- Per-Bed Model: Individual bed placements for clients with flexible entry/exit
- Turnkey House Model: Full house leases for organizations operating their own programs
- Referral Process: Organizations submit applications, we review eligibility, place clients
- Partner Eligibility: Nonprofits, government agencies, faith-based organizations, and service providers
- Contact: For more information, organizations can fill out partnership applications

When users ask about specific housing availability or want to become partners, collect their:
- Organization name
- Contact name
- Email address
- Phone number

Be professional, warm, and focused on helping organizations understand how to work with RE Jones Global. Do not provide information outside the scope of housing referrals, partnerships, and program information.`;

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { message, conversationHistory = [], contactInfo = null } = body;

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Format conversation history for Claude
    const messages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call Anthropic API
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const assistantReply =
      response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response.';

    // Simple contact info extraction
    let updatedContactInfo = contactInfo;
    const emailMatch = message.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = message.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);

    if (emailMatch || phoneMatch) {
      updatedContactInfo = {
        ...contactInfo,
        ...(emailMatch && { email: emailMatch[0] }),
        ...(phoneMatch && { phone: phoneMatch[0] }),
      };
    }

    if (message.toLowerCase().includes('organization:') || message.toLowerCase().includes('we are')) {
      updatedContactInfo = {
        ...updatedContactInfo,
        organizationMentioned: true,
      };
    }

    return Response.json({
      reply: assistantReply,
      contactInfo: updatedContactInfo,
    });
  } catch (error) {
    console.error('AI Assistant Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});