'use client'

import React, { useState, ChangeEvent } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import generateIDFData from '../components/generateIDFDate';

interface Inventor {
  Name: string;
  id: string;
  nationality: string;
  employer: string;
  inventorship: string;
  address: string;
  phone: string;
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


function App() {
  const [title, setTitle] = useState<string>('');
  const [idfData, setIdfData] = useState<IDFData>(defaultIDFData);
  const [loading, setLoading] = useState<boolean>(false);
  const [editFields, setEditFields] = useState<Record<string, boolean>>({});

  const toggleEdit = (fieldPath: string) => {
    setEditFields((prev) => ({
      ...prev,
      [fieldPath]: !prev[fieldPath]
    }));
  };

  const handleChange = (fieldPath: string, value: string) => {
    if (!idfData) return;
    const path = fieldPath.split('.');
    const updated = { ...idfData };
    let pointer: any = updated;

    for (let i = 0; i < path.length - 1; i++) {
      pointer = pointer[path[i]];
    }

    pointer[path[path.length - 1]] = value;
    setIdfData(updated);
  };

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

  const handleDownload = () => {
    if (!idfData) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let y = 10;

    const addLine = (label: string, text: string) => {
      const marginX = 10;
      const maxWidth = 180;
      const lineHeight = 6;
      const bottomMargin = 20;

      doc.setFont('helvetica', 'bold');
      if (y + lineHeight > pageHeight - bottomMargin) {
        doc.addPage();
        y = 10;
      }
      doc.text(label, marginX, y);
      y += lineHeight;

      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(text || '', maxWidth);
      const totalHeight = lines.length * lineHeight;

      if (y + totalHeight > pageHeight - bottomMargin) {
        const spaceLeft = pageHeight - y - bottomMargin;
        const linesThatFit = Math.floor(spaceLeft / lineHeight);
        const firstChunk = lines.slice(0, linesThatFit);
        const remaining = lines.slice(linesThatFit);

        firstChunk.forEach((line : any) => {
          doc.text(line, marginX, y);
          y += lineHeight;
        });

        doc.addPage();
        y = 10;

        remaining.forEach((line : any) => {
          if (y > pageHeight - bottomMargin) {
            doc.addPage();
            y = 10;
          }
          doc.text(line, marginX, y);
          y += lineHeight;
        });

        y += 4;
      } else {
        lines.forEach((line : any) => {
          doc.text(line, marginX, y);
          y += lineHeight;
        });
        y += 4;
      }
    };

    const componentsList = Array.isArray(idfData.invention.components)
      ? idfData.invention.components
      : (idfData.invention.components || '').split('\n').map(line => line.trim()).filter(Boolean);

    // Sections 1 & 2
    addLine('1. DATE:', idfData.date);
    addLine('2. TITLE:', idfData.title);

    // Section 3 - Inventor Details Table
    doc.setFont('helvetica', 'bold');
    doc.text('3. INVENTOR DETAILS:', 10, y);
    y += 4;

    const inventorBody = idfData.inventors
      .filter(inv => inv.Name || inv.id || inv.nationality || inv.employer || inv.inventorship)
      .map(inv => [
        `${inv.Name}\n${inv.id}\n${inv.nationality}`,
        inv.employer,
        `${inv.inventorship}%`,
        `${inv.address || ''}\n${inv.phone || ''}\n${inv.email || ''}`,
        ''
      ]);

    if (inventorBody.length) {
      autoTable(doc, {
        startY: y,
        head: [[
          'Personal Info (Name, ID, Nationality)',
          'Employer',
          '% Inventorship',
          'Contact Info (Home, Phone, Email)',
          'Signature'
        ]],
        body: inventorBody,
        styles: { fontSize: 10, cellPadding: 2 },
        theme: 'grid'
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Section 4
    addLine('4. ABSTRACT OF THE INVENTION:', idfData.abstract);

    // Section 5 - The Invention
    addLine('5. DESCRIPTION:', idfData.invention.description);
    addLine('KEYWORDS:', Array.isArray(idfData.invention.keywords) ? idfData.invention.keywords.join(', ') : '');
    addLine('BACKGROUND:', idfData.invention.background);
    addLine('PROBLEM:', idfData.invention.problem);
    addLine('COMPONENTS:', componentsList.join('\n'));
    addLine('ADVANTAGES:', idfData.invention.advantages);
    addLine('ADDITIONAL DATA:', idfData.invention.additionaldata);
    addLine('RESULTS:', Array.isArray(idfData.invention.results) ? idfData.invention.results.join('\n') : '');

    // Section 6
    doc.setFont('helvetica', 'bold');
    doc.text('6. PRIOR ART:', 10, y);
    y += 4;

    const priorArtBody = idfData.prior_art.filter(p => p.title || p.authors || p.published || p.PublicationDate);
    if (priorArtBody.length) {
      autoTable(doc, {
        startY: y,
        head: [['Title', 'Authors', 'Published', 'Publication Date']],
        body: priorArtBody.map(p => [p.title, p.authors, p.published, p.PublicationDate]),
        styles: { fontSize: 10 },
        theme: 'grid'
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Section 7
    doc.text('7. DISCLOSURE:', 10, y);
    y += 4;
    const disclosureBody = idfData.disclosure.filter(d => d.title || d.authors || d.published || d.Date);
    if (disclosureBody.length) {
      autoTable(doc, {
        startY: y,
        head: [['Title', 'Authors', 'Published', 'Date']],
        body: disclosureBody.map(d => [d.title, d.authors, d.published, d.Date]),
        styles: { fontSize: 10 },
        theme: 'grid'
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Section 8
    doc.text('8. PUBLICATION PLANS:', 10, y);
    y += 4;
    const plansBody = idfData.plans.filter(p => p.title || p.authors || p.disclosed || p.Date);
    if (plansBody.length) {
      autoTable(doc, {
        startY: y,
        head: [['Title', 'Authors', 'Disclosed', 'Date']],
        body: plansBody.map(p => [p.title, p.authors, p.disclosed, p.Date]),
        styles: { fontSize: 10 },
        theme: 'grid'
      });
    }

    // Save
    doc.save(`${title || 'IDF'}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Invention Disclosure Form</h1>
  
      <div className="flex gap-4 mb-6">
        <input
          className="flex-1 px-4 py-2 border rounded shadow-sm"
          placeholder="Input description of Invention"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          onClick={handleGenerate}
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {idfData && (
        <div className="space-y-4 text-sm bg-white p-4 border rounded">
          {/* Styled Header Banner */}
          <div className="mb-6">
            <div className="bg-teal-700 text-white text-center text-sm py-1 font-medium">
              "Hospital Name" Medical Research, Infrastructure & Services Ltd.
            </div>
            <div className="bg-teal-800 text-white text-center text-lg font-semibold py-2 border-t border-white tracking-wide">
              INVENTION DISCLOSURE FORM (IDF)
            </div>

            <div className="border mt-2 p-3 text-sm bg-yellow-300">
              <span className="font-bold">INSTRUCTIONS:</span>{' '}
              This form should be completed <strong>in full, dated</strong> and <strong>signed</strong>. Once completed, please send the form, in Word format, to the IP Manager at THM LTD at:{' '}
              <a href="mailto:amitgill@gmail.com" className="text-blue-800 underline">amitgill@gmail.com</a>
            </div>
          </div>
          {loading ? (<div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="loader-ring mb-4"></div>
                  </div>
                </div>):<></>}
          {/* 1. Date & 2. Title */}
          <div>
            <strong>1. DATE:</strong>
            <input
              type="text"
              className="ml-2 border-none px-2 py-1"
              value={idfData.date}
              placeholder='Please input date'
              onChange={(e) => setIdfData({ ...idfData, date: e.target.value })}
            />
          </div>
          <div>
            <strong>2. TITLE:</strong>
            <input
              type="text"
              className="ml-2 border-none px-2 py-1 w-full"
              value={idfData.title}
              placeholder='Please input title'
              onChange={(e) => setIdfData({ ...idfData, title: e.target.value })}
            />
          </div>
  
          {/* 3. Inventor Table */}
          <div>
            <strong>3. INVENTOR DETAILS:</strong>
            <table className="table-auto w-full mt-2 border text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border px-2 py-1">Personal Info (Name, ID, Nationality)</th>
                  <th className="border px-2 py-1">Employer</th>
                  <th className="border px-2 py-1">% Inventorship</th>
                  <th className="border px-2 py-1">Contact Info (Home, Phone, Email)</th>
                  <th className="border px-2 py-1">Signature</th>
                </tr>
              </thead>
              <tbody>
                {idfData.inventors.map((inv, idx) => (
                  <tr key={idx}>
                    {/* Personal Info */}
                    <td className="border px-0 py-0">
                    {(['Name', 'id', 'nationality'] as (keyof Inventor)[]).map((field, i) => (
                        <div key={i} className="border-b last:border-b-0 px-2 py-1">
                          <input
                            placeholder={`Please input ${field}`}
                            className="w-full border border-transparent hover:border-gray-300 focus:border-blue-500 px-1 py-0.5 focus:outline-none"
                            value={inv[field] ?? ''}
                            onChange={(e) => {
                              const updated = [...idfData.inventors];
                              updated[idx][field] = e.target.value;
                              setIdfData({ ...idfData, inventors: updated });
                            }}
                          />
                        </div>
                      ))}
                    </td>
  
                    {/* Employer */}
                    <td className="border px-2 py-1">
                      <input
                        className="w-full border border-transparent hover:border-gray-300 focus:border-blue-500 px-1 py-0.5 focus:outline-none"
                        value={inv.employer}
                        placeholder='Please input Employer'
                        onChange={(e) => {
                          const updated = [...idfData.inventors];
                          updated[idx].employer = e.target.value;
                          setIdfData({ ...idfData, inventors: updated });
                        }}
                      />
                    </td>
  
                    {/* % Inventorship */}
                    <td className="border px-2 py-1">
                      <input
                        className="w-full border border-transparent hover:border-gray-300 focus:border-blue-500 px-1 py-0.5 focus:outline-none"
                        value={inv.inventorship}
                        placeholder='Please input % of inventorship'
                        onChange={(e) => {
                          const updated = [...idfData.inventors];
                          updated[idx]['inventorship'] = e.target.value;
                          setIdfData({ ...idfData, inventors: updated });
                        }}
                      />
                    </td>
  
                    {/* Contact Info */}
                    <td className="border px-0 py-0">
                      {(['address', 'Phone', 'email'] as (keyof Inventor)[]).map((field, i) => (
                        <div key={i} className="border-b last:border-b-0 px-2 py-1">
                          <input
                            placeholder={field === 'address' ? 'Please input Home Address' : `Please input ${field}`}
                            className="w-full border border-transparent hover:border-gray-300 focus:border-blue-500 px-1 py-0.5 focus:outline-none"
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
  
                    {/* Signature */}
                    <td className="border px-2 py-1">{/* Blank for signature */}</td>
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
                      phone: '',
                      email: ''
                    }
                  ]
                })
              }
              className="mt-2 text-blue-600 hover:underline"
            >
              + Add Inventor
            </button>
          </div>
  
          {/* 4. Abstract */}
          <div>
            <strong>4. ABSTRACT OF THE INVENTION:</strong>
            <div
              className="w-full mt-1 border-none px-2 py-1 min-h-[20px]"
              contentEditable
              data-placeholder="TO BE COMPLETED AFTER FILLING IN THE FORM. Include the need and the proposed solution to said  need"
              suppressContentEditableWarning
              onBlur={(e) => setIdfData({ ...idfData, abstract: e.target.innerText })}
            >
              {idfData.abstract}
            </div>
          </div>
  
          {/* 5. The Invention */}
          <div>
            <strong>5. THE INVENTION</strong>

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
              <div key={key}>
                <strong>{key.toUpperCase()}:</strong>
                <div
                  className="w-full mt-1 border-none px-2 py-1 min-h-[20px]"
                  contentEditable
                  data-placeholder={placeholdertext[key]}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.innerText;
                    if (!idfData) return;

                    const updated = { ...idfData };

                    // Convert specific fields to arrays
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
              </div>
            ))}
          </div>

  
          {idfData && (
            <div>
              <strong>6. PRIOR ART</strong>
              <table className="table-auto w-full mt-2 border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {(['title', 'authors', 'published', 'PublicationDate'] as (keyof PriorArtItem)[]).map((h) => (
                      <th key={h} className="border px-2 py-1">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {idfData.prior_art.map((item, idx) => (
                    <tr key={idx}>
                      {(['title', 'authors', 'published', 'PublicationDate'] as (keyof PriorArtItem)[]).map((h) => (
                        <td key={h} className="border px-2 py-1">
                          <input
                            className="w-full"
                            value={item[h] ?? ''}
                            placeholder={`Please input ${h}`}
                            onChange={(e) => {
                              const updated = [...idfData.prior_art];
                              updated[idx][h] = e.target.value;
                              setIdfData({ ...idfData, prior_art: updated });
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                className="mt-2 text-blue-600 hover:underline"
                onClick={() => {
                  const empty = { title: '', authors: '', published: '', PublicationDate: '' };
                  setIdfData({ ...idfData, prior_art: [...idfData.prior_art, empty] });
                }}
              >
                + Add Row
              </button>
            </div>
          )}


          {idfData && (
            <div>
              <strong>7. DISCLOSURE</strong>
              <table className="table-auto w-full mt-2 border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {(['title', 'authors', 'published', 'Date'] as (keyof DisclosureItem)[]).map((h) => (
                      <th key={h} className="border px-2 py-1">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {idfData.disclosure.map((item, idx) => (
                    <tr key={idx}>
                      {(['title', 'authors', 'published', 'Date'] as (keyof DisclosureItem)[]).map((h) => (
                        <td key={h} className="border px-2 py-1">
                          <input
                            className="w-full"
                            placeholder={`Please input ${h}`}
                            value={item[h] ?? ''}
                            onChange={(e) => {
                              const updated = [...idfData.disclosure];
                              updated[idx][h] = e.target.value;
                              setIdfData({ ...idfData, disclosure: updated });
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                className="mt-2 text-blue-600 hover:underline"
                onClick={() => {
                  const empty = { title: '', authors: '', published: '', Date: '' };
                  setIdfData({ ...idfData, disclosure: [...idfData.disclosure, empty] });
                }}
              >
                + Add Row
              </button>
            </div>
          )}

          {idfData && (
            <div>
              <strong>8. PUBLICATION PLANS</strong>
              <table className="table-auto w-full mt-2 border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {(['title', 'authors', 'disclosed', 'Date'] as (keyof PublicationPlan)[]).map((h) => (
                      <th key={h} className="border px-2 py-1">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {idfData.plans.map((item, idx) => (
                    <tr key={idx}>
                      {(['title', 'authors', 'disclosed', 'Date'] as (keyof PublicationPlan)[]).map((h) => (
                        <td key={h} className="border px-2 py-1">
                          <input
                            className="w-full"
                            placeholder={`Please input ${h}`}
                            value={item[h] ?? ''}
                            onChange={(e) => {
                              const updated = [...idfData.plans];
                              updated[idx][h] = e.target.value;
                              setIdfData({ ...idfData, plans: updated });
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                className="mt-2 text-blue-600 hover:underline"
                onClick={() => {
                  const empty = { title: '', authors: '', disclosed: '', Date: '' };
                  setIdfData({ ...idfData, plans: [...idfData.plans, empty] });
                }}
              >
                + Add Row
              </button>
            </div>
          )}

  
          {/* Download PDF */}
          <button
            className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            onClick={handleDownload}
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
  
  
  
}

export default App;
