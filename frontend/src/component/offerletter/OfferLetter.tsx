import React from 'react';

interface OfferLetterProps {
  date?: string;
  full_name?: string;
  position?: string;
  status?: string;
  university?: string;
  start_date?: string;
  no_of_hours?: string;
  compensation?: string;
  logoSrc?: string; 
  signatureSrc?: string;
}

const OfferLetter = ({
  date,
  full_name,
  position,
  status,
  university,
  start_date,
  no_of_hours,
  compensation,
  logoSrc,
  signatureSrc,
}: OfferLetterProps) => {
  
  const accentColor = '#3b82f6'; 
  // Common styling for list items to ensure alignment with the paragraph text above
  const listItemStyle = { 
    marginBottom: '18px', 
    display: 'flex', 
    lineHeight: '1.5'
  };
  const numberStyle = { 
    width: '20px', // Fixed width for the number
    marginRight: '5px',
    flexShrink: 0 
  };
  const contentStyle = { 
    flexGrow: 1 
  };


  return (
    <div 
      className="a4-page" 
      style={{ 
        width: '100%', 
        backgroundColor: '#ffffff', 
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12pt',
        lineHeight: '1.5'
      }}
    >
      <div style={{ padding: '40px' }}>
        
        {/* HEADER SECTION (Logo Left, Address Right) */}
        <div 
          className="flex justify-between pb-4" 
          style={{ 
            borderBottom: `2px solid ${accentColor}`,
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          {/* LOGO BLOCK (Left) */}
          <img 
            src={logoSrc || "/image.png"} 
            alt="logo" 
            style={{ height: '60px', width: 'auto', objectFit: 'contain' }} 
          />
          
          {/* ADDRESS BLOCK (Right) */}
          <div 
            style={{ 
              color: accentColor, 
              textAlign: 'right' 
            }}
          >
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>4738 Duckhorn Dr,</h2>
            <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Sacramento, CA 95834</h1>
            <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Tel: (916) 646 2080</h1>
            <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Fax: (916) 646 2081</h1>
          </div>
        </div>

        {/* DATE & GREETING */}
        <div style={{ marginTop: '20px' }}>{date}</div>
        <div style={{ marginTop: '20px' }}>
          <b>Dear</b> {full_name},
        </div>

        {/* INTRO PARAGRAPH */}
        <div style={{ marginTop: '20px', textAlign: 'justify' }}>
          Welcome Aboard! We are pleased to offer you a position as a {position}{" "}
          at Key Business Solutions, Inc. and look forward to a mutually
          beneficial relationship. Please note that this position is for your{" "}
          <b>{status}</b> as required by your school, {university}. Thus, please
          note that the following are the terms of your employment with Key
          Business Solutions.
        </div>

        {/* LIST SECTION (FIXED: Manual Numbering using Flexbox) */}
        <div style={{ marginTop: '20px' }}>
          
          {/* Item 1 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>1.</span>
            <span style={contentStyle}>
              <b>Duties:</b> You will be employed with the title of {position}{" "}
              and will render all reasonable duties expected of a {position}.
              These services will be provided at locations designated by Key
              Business Solutions, and will include the offices of our clients.
              During the term of this agreement, you will devote your full
              abilities to the performance of your duties and agree to comply
              with Key Business Solution’s reasonable policies and standards.
            </span>
          </div>

          {/* Item 2 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>2.</span>
            <span style={contentStyle}>
              <b>Starting Date:</b> As discussed during your interview you will
              start working starting {start_date}.
            </span>
          </div>

          {/* Item 3 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>3.</span>
            <span style={contentStyle}>
              <b>Weekly Hours:</b> Please note that your hours shall not exceed
              more than a {no_of_hours} week.
            </span>
          </div>

          {/* Item 4 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>4.</span>
            <span style={contentStyle}>
              <b>Compensation:</b> Please note that this will be an{" "}
              {compensation}.
            </span>
          </div>

          {/* Item 5 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>5.</span>
            <span style={contentStyle}>
              <b>Performance Review:</b> Your performance will be monthly, as a
              progress report for your OPT.
            </span>
          </div>

          {/* Item 6 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>6.</span>
            <span style={contentStyle}>
              <b>Reports:</b> You will provide Key Business Solutions with
              weekly reports that are deemed necessary, including periodic
              summaries of your work-related activities and accomplishments.
            </span>
          </div>

          {/* Item 7 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>7.</span>
            <span style={contentStyle}>
              <b>Termination:</b> This agreement can be terminated by either
              party with proper written notice. Please note that should your
              termination be due to your willful misconduct or non-performance
              at client site, Key Business Solutions need not provide you with
              any advance notice. Otherwise, termination will occur at the
              completion of your OPT.
            </span>
          </div>

          {/* Item 8 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>8.</span>
            <span style={contentStyle}>
              <b>Confidentiality:</b> You will hold in trust and not disclose to
              any party, directly or indirectly, during your employment with Key
              Business Solutions and thereafter, any confidential information
              relating to research, development, trade secrets,
              customer-prospect lists or business affairs of Key Business
              Solutions or its clients.
            </span>
          </div>

          {/* Item 9 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>9.</span>
            <span style={contentStyle}>
              <b>Non-Solicitation Non-Competition:</b> You agree that during the
              period of employment here under and for one year following the
              termination of your employment for any reason, you shall not
              directly or indirectly, provide any form of consulting or
              programming service to any Key Business Solutions clients. You
              further agree that you will not solicit or entertain offers from
              any of the existing of former clients of Key Business Solutions,
              whether for yourself or on behalf of any other entity.
            </span>
          </div>

          {/* Item 10 */}
          <div style={listItemStyle}>
            <span style={numberStyle}>10.</span>
            <span style={contentStyle}>
              <b>Governing Law:</b> This agreement shall be governed by and
              enforced in accordance with the laws of the State of California.
            </span>
          </div>

        </div>

        {/* FOOTER / CLOSING */}
        <div style={{ marginTop: '25px' }}>
          <div style={{ marginBottom: '20px' }}>
            Please note that all of the above terms are effective with your
            proper obtainment of work authorization through your educational
            facility and under your OPT Program.
          </div>
          <div style={{ marginTop: '20px' }}>
            We are very pleased that you will be working with us, and will do
            all we can to ensure that the transition is smooth, and that our
            relationship is mutually beneficial.
            
            <h5 style={{ marginTop: '30px', fontWeight: 'bold' }}>Sincerely,</h5>
            
            <div style={{ marginTop: '10px' }}>
              {/* Signature Image */}
              <img src={signatureSrc || "/sign.png"} alt="Signature" style={{ maxHeight: '60px' }} />
              <h5 style={{ margin: 0, fontWeight: 'bold' }}>Rajan Gutta</h5>
              <h5 style={{ margin: 0 }}>President</h5>
            </div>

            <h5 style={{ marginTop: '40px', fontWeight: 'bold' }}>I agree with the terms stated in this letter.</h5>

            {/* SIGNATURE LINES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                <div style={{ width: '45%' }}>
                    <div style={{ borderBottom: '1px solid black', height: '1px', marginBottom: '8px' }}></div>
                    <div>Mr. {full_name}</div>
                </div>
                 <div style={{ width: '45%' }}>
                    <div style={{ borderBottom: '1px solid black', height: '1px', marginBottom: '8px' }}></div>
                    <div>{date}</div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferLetter;