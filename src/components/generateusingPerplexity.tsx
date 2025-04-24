'use server'

import axios from 'axios';

interface MyObject {
    [key: string]: string; // Important type definition!
  }
  
const text = {
    title:"title",
    abstract:"TO BE COMPLETED AFTER FILLING IN THE FORM. Include the need and the proposed solution to said need",
    prior_art:"[{title, authors, published(journal/conference/thesis/web)], PublicationDate}( Are there publications by you (the inventors) or by others working in the field, with a solution to a similar problem? , Have you conducted a patent search related to the Invention? The following links may be used for conducting a patent search:        http://www.uspto.gov/     https://patents.google.com/ https://worldwide.espacenet.com/ , For other publications, you may search in any search engine (e.g. Google), or in PubMed, for scientific publications. Please note that the inventor has a strict duty to disclose all technology, including scientific and patent publications, or apparatus and processes sold or used in public, that might be relevant to the patentability of the invention. , In addition, please provide publications that help understand the current knowledge in the field of the invention.)",
    disclosure:"[{title, authors, published(journal/conference/thesis/web)], Date}, ( related ideas, or results disclosed in any way prior to the submission of this form )",
    plans:"[{title, authors, disclosed(article/oral presentation/a thesis, other)], Date(Planned publication Date)} ( Do you intend to publish the invention, its related ideas or results in any way in the near future (within the next 6 months)?)",
    description: "(Describe the invention in detaiel including all essential elements. If you have a draft of a scientific article, a presentation, a grant proposal etc. related to the invention please also send by e-mail, in a separate file)",
    keywords: "(array) (Please provide 5 keywords that describe the main features of the invention only )",
    background: "(Provide details on the field of invention, what is common knowledge in the field and what are the pitfall and unanswered needs)",
    problem: "(Describe in detail the need identified by you for which the invention is a solution) (up to 1 paragraph)",
    components: "(Give me them as one string and splite by '--') (Describe in detail the elements of the invention that are crucial for its function. The elements could be parts of a device, a molecular formulation, physical characteristics, computational elements, working conditions, structural features such as size, shape, material etc. Make sure to include all the elements.) (up to 1 page)",
    advantages: "(Based on your knowledge and expertise, describe in detail what is new (not previously known) in the solution proposed, why it is important, and what are the benefits compared to existing solutions) (up to 5 paragraphs)",
    additionaldata: "(Provide figures, sketches, pictures, graphs, statistics, lists, sequences etc.) (up to 5 pages)",
    results: "(array) (Where applicable, provide results such as in vitro, in vivo, prototype, simulation, working computer program, statistics, etc.)  (1~3 pages)",
  }
  
function getValueFromObject(obj: MyObject, key: string): string | undefined {
if (obj.hasOwnProperty(key)) {
    return obj[key];
} else {
    console.error(`Key '${key}' not found in the object.`);
    return undefined; // Or throw an error: throw new Error(`Key '${key}' not found.`);
}
}

const PERPLEXITY_API_KEY = process.env.REACT_APP_PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export default async function generateusingperplexity(title: string, type: string, basic: string) {
    console.log(title, type, basic);
  const prompt = "This is " + type + " about '" + title + " and base data: '" + basic + "' and response must follow this '" + getValueFromObject(text, type) + "' and give me without markdown and give me only answer without any unnessary sentenses like if you response array, you don't have to add some sentenses if it is about prior_art, disclosure, plans, keywords, you only response array and items with style '...':'...' and if it isn't give me also text that show directly and not include [..], charactors like [1]...";
    console.log("prompt", prompt)

  try {
    const response = await axios.post(PERPLEXITY_API_URL, 
      {
        model: 'sonar-pro',
        messages: [
            {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // console.log("json: ", JSON.parse(response.data.content[0].text))
    console.log("response.data.choices[0].message.content", response.data.choices[0].message.content)
    const result = response.data.choices[0].message.content;

    let index = 0;
    let count = 0;

    if(type == "prior_art" || type == "disclosure" || type == "plans" || type == "keywords"){
    for (let j = 0; j < result.length; j++) {
        if (result[j] === '['){
            console.log(count)
            count++;
        }
        else if(result[j] === ']'){
            console.log(count)
            count--;
        }
        if (count == 0){
            index = j
            break;
        }
    }
    console.log(index, result[index]);
    const real_result = (index != 0 ? result.slice(0, index + 1) : result);
 
    console.log("real_result: ",real_result)
    const fixed = real_result.replace(/'/g, '"');
    const parsed = JSON.parse(fixed);
    console.log("fixed: ", fixed)
    // return response.data.choices[0].message.content;
    return fixed;}
    else return result;
  } catch (err : any) {
    console.error('Claude API error:', err.response?.data || err.message);
    throw err;
  }
}
