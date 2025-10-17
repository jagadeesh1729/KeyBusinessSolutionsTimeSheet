interface OfferLetterProps {
  date?: string;
  full_name?: string;
  position?: string;
  status?: string;
  university?: string;
  start_date?: string;
  no_of_hours?: string;
  compensation?: string;
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
}: OfferLetterProps) => {
  return (
    <div className="a4-page">
      <div className="">
        <div className="flex justify-between border-b border-blue-500 pb-4">
          <img src="/image.png" alt="logo" className="" />
          <div className="text-blue-500 text-right">
            <h2>4738 Duckhorn Dr,</h2>
            <h1>Sacramento, CA 95834</h1>
            <h1>Tel: (916) 646 2080</h1>
            <h1>Fax: (916) 646 2081</h1>
          </div>
        </div>
        <div className="mt-4">{date}</div>
        <div className="mt-4">
          <b>Dear</b> {full_name},
        </div>
        <div className="mt-4">
          Welcome Aboard! We are pleased to offer you a position as a {position}{" "}
          at Key Business Solutions, Inc. and look forward to a mutually
          beneficial relationship. Please note that this position is for your{" "}
          <b>{status}</b> as required by your school, {university}. Thus, please
          note that the following are the terms of your employment with Key
          Business Solutions.
        </div>
        <div>
          <ol className="list-decimal list-outside pl-4 custom-list space-y-5">
            <li>
              <b>Duties:</b> You will be employed with the title of {position}{" "}
              and will render all reasonable duties expected of a {position}.
              These services will be provided at locations designated by Key
              Business Solutions, and will include the offices of our clients.
              During the term of this agreement, you will devote your full
              abilities to the performance of your duties and agree to comply
              with Key Business Solution’s reasonable policies and standards.
            </li>
            <li>
              <b>Starting Date:</b> As discussed during your interview you will
              start working starting {start_date}.
            </li>
            <li>
              <b>Weekly Hours:</b> Please note that your hours shall not exceed
              more than a {no_of_hours}week.
            </li>
            <li>
              <b>Compensation:</b> Please note that this will be an{" "}
              {compensation}.
            </li>
            <li>
              <b>Performance Review:</b> Your performance will be monthly, as a
              progress report for your OPT.
            </li>
            <li>
              <b>Reports:</b> You will provide Key Business Solutions with
              weekly reports that are deemed necessary, including periodic
              summaries of your work-related activities and accomplishments.
            </li>
            <li>
              <b>Termination:</b> This agreement can be terminated by either
              party with proper written notice. Please note that should your
              termination be due to your willful misconduct or non-performance
              at client site, Key Business Solutions need not provide you with
              any advance notice. Otherwise, termination will occur at the
              completion of your OPT.
            </li>
            <li>
              <b>Confidentiality:</b> You will hold in trust and not disclose to
              any party, directly or indirectly, during your employment with Key
              Business Solutions and thereafter, any confidential information
              relating to research, development, trade secrets,
              customer-prospect lists or business affairs of Key Business
              Solutions or its clients.
            </li>
            <li>
              <b>Non-Solicitation Non-Competition:</b> You agree that during the
              period of employment here under and for one year following the
              termination of your employment for any reason, you shall not
              directly or indirectly, provide any form of consulting or
              programming service to any Key Business Solutions clients. You
              further agree that you will not solicit or entertain offers from
              any of the existing of former clients of Key Business Solutions,
              whether for yourself or on behalf of any other entity or in any
              manner attempt to induce any of the clients of Key Business
              Solutions to with draw their business from Key Business Solutions.
              You further agree that you will not solicit any key Business
              Solutions employee or consultant to terminate their contractual
              agreements with Key Business Solutions.
            </li>
            <li>
              <b>Governing Law:</b> This agreement shall be governed by and
              enforced in accordance with the laws of the State of California.
              The invalidity of enforceability of any particular provision of
              the agreement will not affect the other provisions mentioned.
            </li>
          </ol>
        </div>
        <div className="mt-5">
          <div>
            Please note that all of the above terms are effective with your
            proper obtainment of work authorization through your educational
            facility and under your OPT Program.
          </div>
          <div className="mt-5">
            We are very pleased that you will be working with us, and will do
            all we can to ensure that the transition is smooth, and that our
            relationship is mutually beneficial.
            <h5>Sincerely,</h5>
            <div>
              <img src="/sign.png" alt="" />
              <h5>Rajan Gutta</h5>
              <h5>President</h5>
              <h5>I agree with the terms stated in this letter.</h5>
            </div>
            <div  className="flex justify-between mt-10">
                <div>
                    <div className="border-b border w-44"></div>
                    <div>Mr.{full_name}</div>
                </div>
                 <div>
                    <div className="border-b border w-44"></div>
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
