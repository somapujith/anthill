import { useState } from "react";
import { ArrowUpRight, Send, Mail } from "lucide-react";
import { words, Reveal, PageHero, BodyContent } from "./core.jsx";
import "./contact.css";

export default function ContactPage({ page, hero }) {
  const [submitted, setSubmitted] = useState(false);
  const [fileMessage, setFileMessage] = useState("");
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });
  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };
  const fieldNames = (page.forms || [])
    .flatMap((form) => form.fields || form.inputs || [])
    .map((f) => f.label || f.placeholder || f.name || "")
    .filter(Boolean);
  const body = hero.blocks.filter(
    (b) =>
      !/^(Your Information|Upload File|Max file size 10MB\.|Uploading\.\.\.|fileuploaded.jpg|Upload failed.*|Submit|Send|Thank you! Your submission has been received!|Oops! Something went wrong while submitting the form\.)$/.test(
        words(b),
      ) && !fieldNames.includes(words(b)),
  );
  const emailHref = `mailto:info@anthillventures.com?subject=${encodeURIComponent(`Website enquiry from ${values.firstName} ${values.lastName}`)}&body=${encodeURIComponent(`Name: ${values.firstName} ${values.lastName}\nCompany: ${values.company}\nPhone: ${values.phone}\nEmail: ${values.email}\n\n${values.message}`)}`;
  const setField = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setSubmitted(false);
  };
  return (
    <>
      <PageHero {...hero} label="Contact Anthill" />
      <section className="container content-contact-layout">
        <div className="content-contact-info">
          <span className="eyebrow">START A CONVERSATION</span>
          <a
            className="content-contact-email"
            href="mailto:info@anthillventures.com"
          >
            Info@anthillventures.com <ArrowUpRight size={24} />
          </a>
          <BodyContent blocks={body} page={page} pathname="/contact" />
        </div>
        <Reveal className="content-contact-form-wrap">
          <form className="content-contact-form" onSubmit={handleSubmit}>
            <div className="content-form-heading">
              <h2>Your Information</h2>
            </div>
            <div className="content-form-row">
              <label>
                First Name
                <input
                  name="First-Name"
                  autoComplete="given-name"
                  required
                  placeholder="First Name"
                  value={values.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                />
              </label>
              <label>
                Last Name
                <input
                  name="Last-Name"
                  autoComplete="family-name"
                  required
                  placeholder="Last Name"
                  value={values.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
              </label>
            </div>
            <div className="content-form-row">
              <label>
                Company
                <input
                  name="Company"
                  autoComplete="organization"
                  placeholder="Company"
                  value={values.company}
                  onChange={(e) => setField("company", e.target.value)}
                />
              </label>
              <label>
                Your Phone
                <input
                  name="Phone-2"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Your Phone"
                  value={values.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </label>
            </div>
            <label>
              Your Email
              <input
                name="Email-2"
                type="email"
                autoComplete="email"
                required
                placeholder="Your Email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </label>
            <label>
              Your Message
              <textarea
                name="Your-Message"
                required
                rows="4"
                placeholder="Your Message"
                value={values.message}
                onChange={(e) => setField("message", e.target.value)}
              />
            </label>
            <label className="content-file-label">
              Upload File
              <input
                name="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size > 10 * 1024 * 1024) {
                    setFileMessage(
                      "Upload failed. Max size for files is 10 MB.",
                    );
                    e.target.value = "";
                  } else
                    setFileMessage(
                      file
                        ? `${file.name} selected. Attach this file when sending your email.`
                        : "",
                    );
                }}
              />
              <span>Max file size 10MB.</span>
            </label>
            {fileMessage && (
              <p className="content-form-note" role="status">
                {fileMessage}
              </p>
            )}
            <p className="content-form-note">
              Prepare your enquiry below, then send it through your email app.
            </p>
            <button className="button content-submit" type="submit">
              Prepare enquiry <Send size={17} />
            </button>
            {submitted && (
              <div className="content-form-feedback" role="status">
                <p>
                  Your enquiry is ready. No message has been sent. Open your
                  email app to send it to Anthill.
                </p>
                <a href={emailHref} className="button">
                  <Mail size={17} /> Send by email
                </a>
              </div>
            )}
          </form>
        </Reveal>
      </section>
    </>
  );
}
