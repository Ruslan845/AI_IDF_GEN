'use server'

import axios from 'axios';

const ANTHROPIC_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;
const apiUrl = 'https://api.anthropic.com/v1/messages';

export default async function generateIDFData(title: any) {
  const prompt =  `Generate a sample data with JSON object with: 
        {date("yyyy-mm-dd"), 
        title, 
        inventors (array){Name, id, nationality, inventorship(give me number of percents), employer, address, Phone, email}, 
        abstract(TO BE COMPLETED AFTER FILLING IN THE FORM. Include the need and the proposed solution to said  need as 5~10 lines), 
        invention {
          description (Describe the invention in detail including all essential elements. If you have a draft of a scientific article, a presentation, a grant proposal etc. related to the invention please also send by e-mail, in a separate file),
          keywords (array) (Please provide 5 keywords that describe the main features of the invention),
          background (Provide details on the field of invention, what is common knowledge in the field and what are the pitfall and unanswered needs),
          problem (Describe in detail the need identified by you for which the invention is a solution) (up to 1 paragraph),
          components (Give me them as one string and splite by '\\n') (Describe in detail the elements of the invention that are crucial for its function. The elements could be parts of a device, a molecular formulation, physical characteristics, computational elements, working conditions, structural features such as size, shape, material etc. Make sure to include all the elements.) (up to 1 page),
          advantages (Based on your knowledge and expertise, describe in detail what is new (not previously known) in the solution proposed, why it is important, and what are the benefits compared to existing solutions) (up to 5 paragraphs)
          additionaldata (Provide figures, sketches, pictures, graphs, statistics, lists, sequences etc.) (up to 5 pages)
          results (array) (Where applicable, provide results such as in vitro, in vivo, prototype, simulation, working computer program, statistics, etc.)  (1~3 pages)
        }, 
        prior_art (array) {title, authors, published(journal/conference/thesis/web), PublicationDate}( Are there publications by you (the inventors) or by others working in the field, with a solution to a similar problem? , Have you conducted a patent search related to the Invention? The following links may be used for conducting a patent search:        http://www.uspto.gov/     https://patents.google.com/ https://worldwide.espacenet.com/ , For other publications, you may search in any search engine (e.g. Google), or in PubMed, for scientific publications. Please note that the inventor has a strict duty to disclose all technology, including scientific and patent publications, or apparatus and processes sold or used in public, that might be relevant to the patentability of the invention. , In addition, please provide publications that help understand the current knowledge in the field of the invention.),
        disclosure (array) {title, authors, published(journal/conference/thesis/web), Date}, (Was the invention, related ideas, or results disclosed in any way prior to the submission of this form? ),
        plans (array) {title, authors, disclosed(article/oral presentation/a thesis, other), Date(Planned publication Date)} ( Do you intend to publish the invention, its related ideas or results in any way in the near future (within the next 6 months)?)
      }
         for "${title}".
        Today is "${new Date().toISOString()}"
        I need only JSON data {...,...,......}
        I don't need 'here is the ...'
        generate each data follow my guide that I give you in (), no response as these`;

  try {
    const response = await axios.post(apiUrl, 
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        temperature: 0.6,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log("response: ", response)
    console.log("response.data: ", response.data);
    console.log("response.data.content: ", response.data.content[0]);
    console.log("json: ", JSON.parse(response.data.content[0].text))

    return JSON.parse(response.data.content?.[0]?.text);
  } catch (err : any) {
    console.error('Claude API error:', err.response?.data || err.message);
    throw err;
  }
}
