'use client'

import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import generateIDFData from './generateIDFDate';
import generateusingperplexity from './generateusingPerplexity'
import { fontBase64 } from '@/fonts/Alef-Regular-normal'; // 👈 import base64 font

// const fontBase64 = "BASE64_ENCODED_STRING_OF_ALEF_REGULAR_TTF"; 

interface LeftPartProps {
  message: any;
  setMessage: (value: any) => void;
}

interface Inventor {
  Name: string;
  id: string;
  nationality: string;
  employer: string;
  inventorship: string;
  address: string;
  Phone: string;
  email: string;
}

interface PriorArtItem {
  title: string;
  authors: string;
  published: string;
  PublicationDate: string;
}

interface DisclosureItem {
  title: string;
  authors: string;
  published: string;
  Date: string;
}

interface PublicationPlan {
  title: string;
  authors: string;
  disclosed: string;
  Date: string;
}

interface Invention {
  description: string;
  keywords: string[] | string;
  background: string;
  problem: string;
  components: string[] | string;
  advantages: string;
  additionaldata: string;
  results: string[] | string;
}

interface IDFData {
  date: string;
  title: string;
  abstract: string;
  inventors: Inventor[];
  invention: Invention;
  prior_art: PriorArtItem[];
  disclosure: DisclosureItem[];
  plans: PublicationPlan[];
}

const defaultIDFData: IDFData = {
  date: '',
  title: '',
  abstract: '',
  inventors: [],
  invention: {
    description: '',
    keywords: [],
    background: '',
    problem: '',
    components: [],
    advantages: '',
    additionaldata: '',
    results: [],
  },
  prior_art: [],
  disclosure: [],
  plans: [],
};

const placeholdertext = {
  'description':"Describe the invention in detail including all essential elements. If you have a draft of a scientific article, a presentation, a grant proposal etc. related to the invention please also send by e-mail, in a separate file",
  'keywords':"Please provide 5 keywords that describe the main features of the invention",
  'background':"Provide details on the field of invention, what is common knowledge in the field and what are the pitfall and unanswered needs",
  'problem':"Describe in detail the need identified by you for which the invention is a solution",
  'components':"Describe in detail the elements of the invention that are crucial for its function. The elements could be parts of a device, a molecular formulation, physical characteristics, computational elements, working conditions, structural features such as size, shape, material etc. Make sure to include all the elements.",
  'advantages':"Based on your knowledge and expertise, describe in detail what is new (not previously known) in the solution proposed, why it is important, and what are the benefits compared to existing solutions",
  'additionaldata':"Provide figures, sketches, pictures, graphs, statistics, lists, sequences etc.",
  'results':"Where applicable, provide results such as in vitro, in vivo, prototype, simulation, working computer program, statistics, etc."
}

function isTableSectionKey(
  key: keyof IDFData
): key is 'prior_art' | 'disclosure' | 'plans' {
  return key === 'prior_art' || key === 'disclosure' || key === 'plans';
}
interface IDFData {
  invention: Invention;
}

export default function Leftpart({message, setMessage} : LeftPartProps) {
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [idfData, setIdfData] = useState<IDFData>(defaultIDFData);
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, boolean>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(message.result){
      const item = message.item;
      const inventionKeys: (keyof Invention)[] = [
        'description',
        'keywords',
        'background',
        'problem',
        'components',
        'advantages',
        'additionaldata',
        'results',
      ];

      const topLevelKeys: (keyof IDFData)[] = [
        'title',
        'abstract',
        'date',
        'prior_art',
        'disclosure',
        'plans',
      ];

      try {
        let updated : any;
        // if(title == "prior_art" || title == "disclosure" || title == "plans")
        updated = message.result;
        // else
        // {
        //   setMessage({title, item, current, result:""})
        // }
        if (inventionKeys.includes(item as keyof Invention)) {
          const key = item as keyof Invention;
          setIdfData((prev) => ({
            ...prev,
            invention: {
              ...prev.invention,
              [key]: ['keywords', 'results', 'components'].includes(key)
                ? updated.split(',').map((v: string) => v.trim())
                : updated,
            },
          }));
        } else if (topLevelKeys.includes(item as keyof IDFData)) {
          const key = item as keyof IDFData;
          console.log('prior_art: ', key, updated)
          setIdfData((prev) => ({
            ...prev,
            [key]: ['prior_art', 'disclosure', 'plans'].includes(key)
              ? JSON.parse(updated)
              : updated,
          }));
        }
        setUpdatingField(null);
      } catch (err) {
        console.error('Error updating field:', err);
      }
      setMessage({})
    }
  }, [message])

  const handleGenerate = async () => {
    if (!title) return;
    setLoading(true);
    try {
      const data: IDFData = await generateIDFData(title);
      setIdfData(data);
      console.log("idfData: ", idfData)
    } catch (err) {
      alert('Error fetching data from Claude API.');
    }
    setLoading(false);
  };

  const handleUpdateOne = async (item: keyof IDFData | keyof Invention) => {
    setUpdatingField(item);
  
    const inventionKeys: (keyof Invention)[] = [
      'description',
      'keywords',
      'background',
      'problem',
      'components',
      'advantages',
      'additionaldata',
      'results',
    ];
  
    const topLevelKeys: (keyof IDFData)[] = [
      'title',
      'abstract',
      'date',
      'prior_art',
      'disclosure',
      'plans',
    ];
  
    let current = '';
  
    if (inventionKeys.includes(item as keyof Invention)) {
      const key = item as keyof Invention;
      const value = idfData.invention[key];
      current = Array.isArray(value) ? value.join(', ') : value ?? '';
    } else if (topLevelKeys.includes(item as keyof IDFData)) {
      const key = item as keyof IDFData;
      const value = idfData[key];
  
      current =
        Array.isArray(value) || typeof value === 'object'
          ? JSON.stringify(value)
          : (value as string) ?? '';
    }
  
    try {
      let updated : any;
      if(title == "prior_art" || title == "disclosure" || title == "plans"){
        updated = await generateusingperplexity(title, item, current);
        if (inventionKeys.includes(item as keyof Invention)) {
          const key = item as keyof Invention;
          setIdfData((prev) => ({
            ...prev,
            invention: {
              ...prev.invention,
              [key]: ['keywords', 'results', 'components'].includes(key)
                ? updated.split(',').map((v: string) => v.trim())
                : updated,
            },
          }));
        } else if (topLevelKeys.includes(item as keyof IDFData)) {
          const key = item as keyof IDFData;
          console.log('prior_art: ', key, updated)
          setIdfData((prev) => ({
            ...prev,
            [key]: ['prior_art', 'disclosure', 'plans'].includes(key)
              ? JSON.parse(updated)
              : updated,
          }));
        }
        setUpdatingField(null);
      }
      else
      {
        setMessage({title, item, current, result:""})
      }
    } catch (err) {
      console.error('Error updating field:', err);
    }
  };

  const handleDownload = () => {
    if (!idfData) return;

    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineHeight = 6;
    let y = margin;

    // ✅ Embed the font only when downloading
    // doc.addFileToVFS('Alef-Regular.ttf', fontBase64);
    doc.addFileToVFS('Alef-Regular.ttf', fontBase64);
    doc.addFont('Alef-Regular.ttf', 'Alef', 'normal');
    doc.setFont('Alef', 'normal');
    // Helper to detect Hebrew
    const isHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);

    // Text writer
    const writeText = (text: string, x: number, y: number) => {
      const rtl = isHebrew(text);
      doc.setFont('Alef', 'normal');
      doc.text(text, rtl ? pageWidth - x : x, y, {
        align: rtl ? 'right' : 'left',
        isInputRtl: rtl,
      });
    };

    // Multiline block writer
    const addMultiline = (label: string, text: string = '') => {
      const maxWidth = pageWidth - margin * 2;
      const lines = doc.splitTextToSize(text, maxWidth);
      const totalHeight = lines.length * lineHeight;

      if (y + totalHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      writeText(label, margin, y);
      y += lineHeight;

      lines.forEach((line: any) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        writeText(line, margin, y);
        y += lineHeight;
      });

      y += 2;
    };

    // Table Writer
    const addTable = (title: string, head: string[][], body: string[][]) => {
      if (y + 10 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('Alef', 'normal');
      writeText(title, margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head,
        body,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 2, font: 'Alef' },
        theme: 'grid',
        didDrawPage: (data : any) => {
          y = data.cursor.y + 10;
        },
      });

      if (doc.lastAutoTable?.finalY) {
        y = doc.lastAutoTable.finalY + 10;
      }
    };

    // Top Banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFillColor(173, 216, 230);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.text('"Hospital Name" Medical Research, Infrastructure & Services Ltd.', pageWidth / 2, 5, { align: 'center' });

    doc.setFillColor(100, 149, 237);
    doc.rect(0, 8, pageWidth, 12, 'F');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('INVENTION DISCLOSURE FORM (IDF)', pageWidth / 2, 16, { align: 'center' });

    y = 24;

    // Sections
    doc.setFontSize(12);
    doc.setFont('Alef', 'normal');

    writeText(`1. DATE: ${idfData.date || ''}`, margin, y);
    y += lineHeight;

    writeText(`2. TITLE: ${idfData.title || ''}`, margin, y);
    y += lineHeight + 2;

    // Inventors Table
    const inventorBody = idfData.inventors?.filter(inv => inv.Name || inv.id || inv.nationality || inv.employer || inv.inventorship)
      .map(inv => [
        `${inv.Name}\n${inv.id}\n${inv.nationality}`,
        inv.employer,
        `${inv.inventorship}%`,
        `${inv.address || ''}\n${inv.Phone || ''}\n${inv.email || ''}`,
        ''
      ]) || [];

    if (inventorBody.length) {
      addTable(
        '3. INVENTOR DETAILS:',
        [[
          'Personal Info (Name, ID, Nationality)',
          'Employer',
          '% Inventorship',
          'Contact Info (Home, Phone, Email)',
          'Signature'
        ]],
        inventorBody
      );
    }

    addMultiline('4. ABSTRACT OF THE INVENTION:', idfData.abstract);
    addMultiline('5. DESCRIPTION:', idfData.invention?.description);
    addMultiline('KEYWORDS:', Array.isArray(idfData.invention?.keywords) ? idfData.invention.keywords.join(', ') : '');
    addMultiline('BACKGROUND:', idfData.invention?.background);
    addMultiline('PROBLEM:', idfData.invention?.problem);

    const componentsList = Array.isArray(idfData.invention?.components)
      ? idfData.invention.components
      : (idfData.invention?.components || '').split('\n').map((line: string) => line.trim()).filter(Boolean);

    addMultiline('COMPONENTS:', componentsList.join('\n'));
    addMultiline('ADVANTAGES:', idfData.invention?.advantages);
    addMultiline('ADDITIONAL DATA:', idfData.invention?.additionaldata);
    addMultiline('RESULTS:', Array.isArray(idfData.invention?.results) ? idfData.invention.results.join('\n') : '');

    // Prior Art Table
    const priorArtBody = idfData.prior_art?.filter(p => p.title || p.authors || p.published || p.PublicationDate)
      .map(p => [p.title, p.authors, p.published, p.PublicationDate]) || [];

    if (priorArtBody.length) {
      addTable('6. PRIOR ART:', [['Title', 'Authors', 'Published', 'Publication Date']], priorArtBody);
    }

    // Disclosure Table
    const disclosureBody = idfData.disclosure?.filter(d => d.title || d.authors || d.published || d.Date)
      .map(d => [d.title, d.authors, d.published, d.Date]) || [];

    if (disclosureBody.length) {
      addTable('7. DISCLOSURE:', [['Title', 'Authors', 'Published', 'Date']], disclosureBody);
    }

    // Plans Table
    const plansBody = idfData.plans?.filter(p => p.title || p.authors || p.disclosed || p.Date)
      .map(p => [p.title, p.authors, p.disclosed, p.Date]) || [];

    if (plansBody.length) {
      addTable('8. PUBLICATION PLANS:', [['Title', 'Authors', 'Disclosed', 'Date']], plansBody);
    }

    // Footer
    const lastPage = doc.getNumberOfPages();
    doc.setPage(lastPage);
    doc.setFontSize(10);
    doc.setFont('Alef', 'normal');
    doc.setTextColor(100);
    writeText("PLEASE FEEL FREE TO CONTACT US FOR QUESTIONS:", margin, pageHeight - 15);
    writeText("amitgill@gmail.com", margin, pageHeight - 8);

    // Save
    doc.save(`${idfData.title || 'IDF'}.pdf`);
  };

  function changeToFallbackStyles(elem: HTMLElement): Record<string, { color: string; backgroundColor: string }> {
    const originalStyles: Record<string, { color: string; backgroundColor: string }> = {};

    // Select all child elements of the provided parent element
    const elements = elem.querySelectorAll<HTMLElement>('*');

    // Iterate through each element to manage styles
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;

      originalStyles[htmlElement.tagName] = {
        color: htmlElement.style.color || '',
        backgroundColor: htmlElement.style.backgroundColor || '',
      };

      // Replace color with oklch with a fallback
      if (htmlElement.style.color.includes('oklch')) {
        console.warn('Replacing unsupported color "oklch" with fallback black');
        htmlElement.style.color = 'rgb(0, 0, 0)'; // Fallback to black
      }
      if (htmlElement.style.backgroundColor.includes('oklch')) {
        console.warn('Replacing unsupported background color "oklch" with fallback white');
        htmlElement.style.backgroundColor = 'white'; // Fallback to white
      }

      // Check computed styles for any unsupported color functions
      const computedStyle = getComputedStyle(htmlElement);
      if (computedStyle.color.includes('oklch')) {
        console.warn('Computed color included "oklch", switching to fallback');
        htmlElement.style.color = 'rgb(0, 0, 0)'; // Fallback to black
      }
      if (computedStyle.backgroundColor.includes('oklch')) {
        console.warn('Computed background color included "oklch", switching to fallback');
        htmlElement.style.backgroundColor = 'white'; // Fallback to white
      }
    });

    return originalStyles;
  }
  
  function resetStyles(elem: HTMLElement, originalStyles: Record<string, { color: string; backgroundColor: string }>): void {
    for (const tagName in originalStyles) {
      const elements = elem.getElementsByTagName(tagName);
      Array.from(elements).forEach((el) => {
        const htmlElement = el as HTMLElement; // Cast to HTMLElement
        htmlElement.style.color = originalStyles[tagName].color; // Reset color
        htmlElement.style.backgroundColor = originalStyles[tagName].backgroundColor; // Reset background
      });
    }
  }
  
  return (
    <div className="max-w-6xl mx-auto p-8 font-sans bg-gray-50 min-h-screen">
      <header className="mb-10 exclude-from-pdf">
        <h1 className="text-4xl font-extrabold text-blue-700 text-center">Invention Disclosure Form</h1>
        <p className="text-center text-gray-600 mt-2 text-sm">
          Please complete the form with accurate and detailed information.
        </p>
      </header>

      <section className="bg-white rounded-xl shadow-lg p-6 space-y-8">
        <div ref={contentRef} id="content" >
        {/* Title + Generate Button */}
        <div className="flex flex-col md:flex-row gap-4 exclude-from-pdf">
          <input
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Input description of Invention"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
  
        {idfData && (
          <div className="space-y-6 text-sm">
            {/* Header Banner */}
            <div className="rounded overflow-hidden shadow">
              <div className="bg-blue-500 text-gray-800 text-center text-xs py-1 font-medium">
                "Hospital Name" Medical Research, Infrastructure & Services Ltd.
              </div>
              <div className="bg-blue-400 text-gray-800 text-center text-lg font-semibold py-2 tracking-wide">
                INVENTION DISCLOSURE FORM (IDF)
              </div>
              <div className="bg-yellow-300 p-4 text-gray-900 border-t border-white exclude-from-pdf">
                <strong>INSTRUCTIONS:</strong> Complete this form <strong>in full, dated</strong> and <strong>signed</strong>. Email to IP Manager at:{" "}
                <a href="mailto:amitgill@gmail.com" className="text-blue-800 underline">amitgill@gmail.com</a>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-gray-700 text-sm animate-pulse">Loading, please wait...</p>
                </div>
              </div>
            ) : null}

            {/* 1. Date */}
            <div className="flex items-center gap-4 mb-4">
              <label className="w-24 text-sm font-medium text-gray-700" htmlFor="date">1. DATE</label>
              <input
                id="date"
                type="date"
                className="flex-1 px-4 py-2 no-border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={idfData.date}
                onChange={(e) => setIdfData({ ...idfData, date: e.target.value })}
              />
            </div>

  
            {/* 2. Title */}
            <div className="flex items-center gap-4 mb-4">
              <label htmlFor="title" className="w-24 text-sm font-medium text-gray-700">2. TITLE</label>
              <input
                id="title"
                type="text"
                className="flex-1 px-4 py-2 no-border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Please input title"
                value={idfData.title}
                onChange={(e) => setIdfData({ ...idfData, title: e.target.value })}
              />
              <button
                className="bg-gray-300 hover:bg-gray-200 text-gray-800 text-sm px-4 py-2 rounded-md shadow whitespace-nowrap exclude-from-pdf"
                onClick={() => handleUpdateOne('title')}
                disabled={updatingField != null}
              >
                {updatingField === 'title' ? 'Generating...' : 'AI assist'}
              </button>
            </div>

  
  
          {/* 3. Inventor Table */}
          <div>
            <strong className="block text-lg font-semibold text-gray-800 mb-2">3. INVENTOR DETAILS:</strong>
            <table className="table-auto w-full border border-gray-300 text-sm rounded-md shadow-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="border px-3 py-2">Personal Info (Name, ID, Nationality)</th>
                  <th className="border px-3 py-2">Employer</th>
                  <th className="border px-3 py-2">% Inventorship</th>
                  <th className="border px-3 py-2">Contact Info (Home, Phone, Email)</th>
                  <th className="border px-3 py-2">Signature</th>
                  <th className="border px-3 py-2 exclude-from-pdf">Action</th>
                </tr>
              </thead>
              <tbody>
                {idfData.inventors.map((inv, idx) => (
                  <tr key={idx} className="even:bg-gray-50">
                    <td className="border px-0 py-0">
                      {(['Name', 'id', 'nationality'] as (keyof Inventor)[]).map((field, i) => (
                        <div key={i} className="border-b last:border-b-0 px-3 py-1">
                          <input
                            placeholder={`Please input ${field}`}
                            className="w-full px-2 py-1 no-border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={inv[field] || ''}
                            onChange={(e) => {
                              const updated = [...idfData.inventors];
                              updated[idx][field] = e.target.value;
                              setIdfData({ ...idfData, inventors: updated });
                            }}
                          />
                        </div>
                      ))}
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className={"w-full px-2 py-1 no-border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"}
                        value={inv.employer}
                        placeholder='Please input Employer'
                        onChange={(e) => {
                          const updated = [...idfData.inventors];
                          updated[idx].employer = e.target.value;
                          setIdfData({ ...idfData, inventors: updated });
                        }}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full px-2 py-1 no-border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={inv.inventorship}
                        placeholder='Please input % of inventorship'
                        onChange={(e) => {
                          const updated = [...idfData.inventors];
                          updated[idx]['inventorship'] = e.target.value;
                          setIdfData({ ...idfData, inventors: updated });
                        }}
                      />
                    </td>
                    <td className="border px-0 py-0">
                      {(['address', 'Phone', 'email'] as (keyof Inventor)[]).map((field, i) => (
                        <div key={i} className="border-b last:border-b-0 px-3 py-1">
                          <input
                            placeholder={field === 'address' ? 'Please input Home Address' : `Please input ${field}`}
                            className="w-full px-2 py-1 no-border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={inv[field] || ''}
                            onChange={(e) => {
                              const updated = [...idfData.inventors];
                              updated[idx][field] = e.target.value;
                              setIdfData({ ...idfData, inventors: updated });
                            }}
                          />
                        </div>
                      ))}
                    </td>
                    <td className="border px-3 py-2 text-center text-gray-400 italic"><div className='exclude-from-pdf'>Signed</div></td>
                    <td className="border px-3 py-2 text-center exclude-from-pdf">
                      <button
                        onClick={() => {
                          const updated = [...idfData.inventors];
                          updated.splice(idx, 1);
                          setIdfData({ ...idfData, inventors: updated });
                        }}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() =>
                setIdfData({
                  ...idfData,
                  inventors: [
                    ...idfData.inventors,
                    {
                      Name: '',
                      id: '',
                      nationality: '',
                      inventorship: '',
                      employer: '',
                      address: '',
                      Phone: '',
                      email: '',
                    },
                  ],
                })
              }
              className="mt-2 text-blue-600 hover:underline text-sm exclude-from-pdf"
            >
              + Add Inventor
            </button>
          </div>

  
          {/* 4. ABSTRACT OF THE INVENTION */}
          <div>
            <strong className="block text-lg font-semibold text-gray-800 mb-2">4. ABSTRACT OF THE INVENTION:</strong>
            <div
              className="w-full min-h-[60px] px-3 py-2 no-border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              contentEditable
              data-placeholder="TO BE COMPLETED AFTER FILLING IN THE FORM. Include the need and the proposed solution to said need"
              suppressContentEditableWarning
              onBlur={(e) => setIdfData({ ...idfData, abstract: e.target.innerText })}
            >
              {idfData.abstract}
            </div>
            <button
              className="mt-2 text-sm px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-200 flex items-center gap-2 exclude-from-pdf"
              onClick={() => handleUpdateOne('abstract')}
              disabled={updatingField === 'abstract'}
            >
              {updatingField === 'abstract' ? (
                <svg className="animate-spin h-4 w-4 text-gray-800" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : 'AI assist'}
            </button>
          </div>

  
          {/* 5. THE INVENTION */}
          <div>
            <strong className="block text-lg font-semibold text-gray-800 mb-2">5. THE INVENTION</strong>

            {(
              [
                'description',
                'keywords',
                'background',
                'problem',
                'components',
                'advantages',
                'additionaldata',
                'results',
              ] as (keyof Invention)[]
            ).map((key) => (
              <div key={key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{key.toUpperCase()}:</label>
                <div
                  className="w-full min-h-[60px] whitespace-pre-wrap break-words px-3 py-2 no-border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  contentEditable
                  data-placeholder={placeholdertext[key]}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.innerText;
                    if (!idfData) return;

                    const updated = { ...idfData };

                    const fieldsToArray = ['keywords', 'results', 'components'] as (keyof Invention)[];
                    if (fieldsToArray.includes(key)) {
                      (updated.invention[key] as string[]) = val.split(',').map((v) => v.trim());
                    } else {
                      (updated.invention[key] as string) = val;
                    }

                    setIdfData(updated);
                  }}
                >
                  {Array.isArray(idfData?.invention[key])
                    ? (idfData.invention[key] as string[]).join(', ')
                    : (idfData.invention[key] as string)}
                </div>
                <button
                  className="mt-2 text-sm px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-200 flex items-center gap-2 exclude-from-pdf"
                  onClick={() => handleUpdateOne(key)}
                  disabled={updatingField != null}
                >
                  {updatingField === key ? (
                    <svg className="animate-spin h-4 w-4 text-gray-800" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : 'AI assist'}
                </button>
              </div>
            ))}
          </div>


  
            {idfData && (
              <div>
                <strong className="block text-lg font-semibold text-gray-800 mb-2">6. PRIOR ART</strong>
                <table className="table-auto w-full border border-gray-300 text-sm shadow-sm rounded-md mt-2">
                  <thead className="bg-gray-100 text-left text-gray-700">
                    <tr>
                      {(['title', 'authors', 'published', 'PublicationDate'] as (keyof PriorArtItem)[]).map((h) => (
                        <th key={h} className="border px-3 py-2 capitalize">{h}</th>
                      ))}
                      <th className="border px-3 py-2 exclude-from-pdf">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {idfData.prior_art.map((item, idx) => (
                      <tr key={idx} className="even:bg-gray-50">
                        {(['title', 'authors', 'published', 'PublicationDate'] as (keyof PriorArtItem)[]).map((h) => (
                          <td key={h} className="border px-3 py-2">
                            <input
                              className="w-full px-2 py-1 no-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={item[h] || ''}
                              placeholder={`Please input ${h}`}
                              onChange={(e) => {
                                const updated = [...idfData.prior_art];
                                updated[idx][h] = e.target.value;
                                setIdfData({ ...idfData, prior_art: updated });
                              }}
                            />
                          </td>
                        ))}
                        <td className="border px-3 py-2 text-center exclude-from-pdf">
                          <button
                            onClick={() => {
                              const updated = [...idfData.prior_art];
                              updated.splice(idx, 1);
                              setIdfData({ ...idfData, prior_art: updated });
                            }}
                            className="p-2 text-red-600 hover:text-red-800"
                            title="Delete row"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-center gap-4 mt-2 exclude-from-pdf">
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => {
                      const empty = { title: '', authors: '', published: '', PublicationDate: '' };
                      setIdfData({ ...idfData, prior_art: [...idfData.prior_art, empty] });
                    }}
                  >
                    + Add Row
                  </button>
                  <button
                    className="text-sm px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-200 flex items-center gap-2"
                    onClick={() => handleUpdateOne('prior_art')}
                    disabled={updatingField === 'prior_art'}
                  >
                    {updatingField === 'prior_art' ? (
                      <svg className="animate-spin h-4 w-4 text-gray-800" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : 'AI assist'}
                  </button>
                </div>
              </div>


          )}



          {idfData && (
            <div>
              <strong className="block text-lg font-semibold text-gray-800 mb-2">7. DISCLOSURE</strong>
              <table className="table-auto w-full border border-gray-300 text-sm shadow-sm rounded-md mt-2">
                <thead className="bg-gray-100 text-left text-gray-700">
                  <tr>
                    {(['title', 'authors', 'published', 'Date'] as (keyof DisclosureItem)[]).map((h) => (
                      <th key={h} className="border px-3 py-2 capitalize">{h}</th>
                    ))}
                    <th className="border px-3 py-2 exclude-from-pdf">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {idfData.disclosure.map((item, idx) => (
                    <tr key={idx} className="even:bg-gray-50">
                      {(['title', 'authors', 'published', 'Date'] as (keyof DisclosureItem)[]).map((h) => (
                        <td key={h} className="border px-3 py-2">
                          <input
                            className="w-full px-2 py-1 no-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Please input ${h}`}
                            value={item[h] || ''}
                            onChange={(e) => {
                              const updated = [...idfData.disclosure];
                              updated[idx][h] = e.target.value;
                              setIdfData({ ...idfData, disclosure: updated });
                            }}
                          />
                        </td>
                      ))}
                      <td className="border px-3 py-2 text-center exclude-from-pdf">
                        <button
                          onClick={() => {
                            const updated = [...idfData.disclosure];
                            updated.splice(idx, 1);
                            setIdfData({ ...idfData, disclosure: updated });
                          }}
                          className="p-2 text-red-600 hover:text-red-800"
                          title="Delete row"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center gap-4 mt-2 exclude-from-pdf">
                <button
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => {
                    const empty = { title: '', authors: '', published: '', Date: '' };
                    setIdfData({ ...idfData, disclosure: [...idfData.disclosure, empty] });
                  }}
                >
                  + Add Row
                </button>
                <button
                  className="text-sm px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-200 flex items-center gap-2"
                  onClick={() => handleUpdateOne('disclosure')}
                  disabled={updatingField === 'disclosure'}
                >
                  {updatingField === 'disclosure' ? (
                    <svg className="animate-spin h-4 w-4 text-gray-800" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : 'AI assist'}
                </button>
              </div>
            </div>

          )}


          {idfData && (
            <div>
              <strong className="block text-lg font-semibold text-gray-800 mb-2">8. PUBLICATION PLANS</strong>
              <table className="table-auto w-full border border-gray-300 text-sm shadow-sm rounded-md mt-2">
                <thead className="bg-gray-100 text-left text-gray-700">
                  <tr>
                    {(['title', 'authors', 'disclosed', 'Date'] as (keyof PublicationPlan)[]).map((h) => (
                      <th key={h} className="border px-3 py-2 capitalize">{h}</th>
                    ))}
                    <th className="border px-3 py-2 exclude-from-pdf">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {idfData.plans.map((item, idx) => (
                    <tr key={idx} className="even:bg-gray-50">
                      {(['title', 'authors', 'disclosed', 'Date'] as (keyof PublicationPlan)[]).map((h) => (
                        <td key={h} className="border px-3 py-2">
                          <input
                            className="w-full px-2 py-1 no-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Please input ${h}`}
                            value={item[h] || ''}
                            onChange={(e) => {
                              const updated = [...idfData.plans];
                              updated[idx][h] = e.target.value;
                              setIdfData({ ...idfData, plans: updated });
                            }}
                          />
                        </td>
                      ))}
                      <td className="border px-3 py-2 text-center exclude-from-pdf">
                        <button
                          onClick={() => {
                            const updated = [...idfData.plans];
                            updated.splice(idx, 1);
                            setIdfData({ ...idfData, plans: updated });
                          }}
                          className="p-2 text-red-600 hover:text-red-800"
                          title="Delete row"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center gap-4 mt-2 exclude-from-pdf">
                <button
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => {
                    const empty = { title: '', authors: '', disclosed: '', Date: '' };
                    setIdfData({ ...idfData, plans: [...idfData.plans, empty] });
                  }}
                >
                  + Add Row
                </button>
                <button
                  className="text-sm px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-200 flex items-center gap-2"
                  onClick={() => handleUpdateOne('plans')}
                  disabled={updatingField === 'plans'}
                >
                  {updatingField === 'plans' ? (
                    <svg className="animate-spin h-4 w-4 text-gray-800" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : 'AI assist'}
                </button>
              </div>
            </div>

          )}


  
            {/* Download Button */}
            <div className="text-center exclude-from-pdf flex justify-between">
              <button
                className="bg-gray-300 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-md shadow transition "
                onClick={handleDownload}
              >
                Download PDF
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-md shadow transition exclude-from-pdf"
                onClick={handleGenerate}
              >
                {loading ? "generating..." : "generate all answers in one time"}
              </button>
            </div>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}

