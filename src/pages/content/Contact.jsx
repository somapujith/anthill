import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  Mail,
  Send,
  Upload,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { words, PageHero } from "./core.jsx";
import "./contact.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const FILE_TOO_LARGE = "Upload failed. Max size for files is 10 MB.";
const STEPS = ["Your Information", "Prepare enquiry", "Send by email"];
const REQUIRED = ["firstName", "lastName", "email", "message"];
const CONTROL_NAMES = {
  firstName: "First-Name",
  lastName: "Last-Name",
  email: "Email-2",
  message: "Your-Message",
};
const OFFICE_ZONES = {
  India: { zone: "Asia/Kolkata", abbreviation: "IST" },
  Singapore: { zone: "Asia/Singapore", abbreviation: "SGT" },
};

function validate(values) {
  const errors = {};
  if (!values.firstName.trim()) errors.firstName = "Enter your first name.";
  if (!values.lastName.trim()) errors.lastName = "Enter your last name.";
  if (!values.email.trim()) errors.email = "Enter your email.";
  else if (!/^\S+@\S+\.\S+$/.test(values.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!values.message.trim()) errors.message = "Write your message.";
  return errors;
}

function Field({ id, label, error, required, multiline, wide, ...control }) {
  const Control = multiline ? "textarea" : "input";
  const errorId = `${id}-error`;
  return (
    <div
      className={`contact-cell${wide ? " contact-cell--wide" : ""}${multiline ? " contact-cell--message" : ""}`}
      data-invalid={error ? "true" : undefined}
      data-filled={control.value ? "true" : undefined}
    >
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="contact-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <Control
        id={id}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        {...control}
      />
      {error && (
        <p className="contact-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

function OfficeTime({ zone, abbreviation }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: zone,
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const timer = setInterval(tick, 15000);
    return () => clearInterval(timer);
  }, [zone]);
  return (
    <p className="contact-office-time">
      Local time <time>{time}</time> {abbreviation}
    </p>
  );
}

export default function ContactPage({ hero }) {
  const reduced = useReducedMotion();
  const root = useRef(null);
  const sendLink = useRef(null);
  const draft = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [fileMessage, setFileMessage] = useState("");
  const [fileState, setFileState] = useState("");
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });

  const blockAfter = (label) => {
    const index = hero.blocks.findIndex((b) => words(b) === label);
    return index >= 0 ? hero.blocks[index + 1] : undefined;
  };
  const emailBlock = blockAfter("Inquiries");
  const phone = words(blockAfter(words(emailBlock || {})) || {});
  const offices = ["India", "Singapore"].map((name) => ({
    name,
    address: words(blockAfter(name) || {}),
    ...OFFICE_ZONES[name],
  }));

  const subject = `Website enquiry from ${values.firstName} ${values.lastName}`;
  const emailHref = `mailto:info@anthillventures.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${values.firstName} ${values.lastName}\nCompany: ${values.company}\nPhone: ${values.phone}\nEmail: ${values.email}\n\n${values.message}`)}`;

  const step = submitted
    ? 3
    : REQUIRED.every((field) => values[field].trim())
      ? 2
      : 1;

  const setField = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
    setSubmitted(false);
  };
  const bind = (field) => ({
    value: values[field],
    error: errors[field],
    onChange: (event) => setField(field, event.target.value),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      event.currentTarget.elements[CONTROL_NAMES[first]].focus();
      return;
    }
    setSubmitted(true);
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (file && file.size > MAX_FILE_BYTES) {
      setFileMessage(FILE_TOO_LARGE);
      setFileState("error");
      event.target.value = "";
    } else {
      setFileMessage(
        file
          ? `${file.name} selected. Attach this file when sending your email.`
          : "",
      );
      setFileState(file ? "selected" : "");
    }
  };

  // The submit button gives way to the draft, so focus follows to its action
  // while the whole draft, not just the link, is brought into view.
  useEffect(() => {
    if (!submitted) return;
    sendLink.current?.focus({ preventScroll: true });
    draft.current?.scrollIntoView({
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [submitted, reduced]);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(root.current);
        const once = (trigger, start = "top 88%") => ({
          trigger,
          start,
          once: true,
        });
        // Opacity only, never visibility: a hidden field could not take keyboard focus.
        gsap.from(q(".contact-heading-line > span"), {
          yPercent: 108,
          duration: 1.05,
          stagger: 0.08,
          ease: "expo.out",
          clearProps: "transform",
          scrollTrigger: once(q(".contact-sheet-grid")),
        });
        gsap.from(q(".contact-steps li"), {
          opacity: 0,
          y: 18,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "opacity,transform",
          scrollTrigger: once(q(".contact-steps")),
        });
        gsap.from(q(".contact-fields > *"), {
          opacity: 0,
          y: 22,
          duration: 0.75,
          stagger: 0.055,
          ease: "power3.out",
          clearProps: "opacity,transform",
          scrollTrigger: once(q(".contact-fields")),
        });
        gsap.from(q(".contact-email-text"), {
          yPercent: 104,
          duration: 1.15,
          ease: "expo.out",
          clearProps: "transform",
          scrollTrigger: once(q(".contact-email"), "top 92%"),
        });
        gsap.from(q(".contact-offices-rule"), {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.3,
          ease: "expo.inOut",
          clearProps: "transform",
          scrollTrigger: once(q(".contact-offices-rule"), "top 94%"),
        });
        gsap.from(q(".contact-office"), {
          opacity: 0,
          y: 26,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "opacity,transform",
          scrollTrigger: once(q(".contact-office-grid"), "top 92%"),
        });
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <>
      <PageHero {...hero} label="Contact Anthill" />
      <div className="contact-page" ref={root}>
        <section className="contact-sheet" aria-labelledby="contact-heading">
          <div className="container contact-sheet-grid">
            <div className="contact-intro">
              <span className="eyebrow">START A CONVERSATION</span>
              <h2 className="contact-heading" id="contact-heading">
                <span className="contact-heading-line">
                  <span>Your</span>
                </span>{" "}
                <span className="contact-heading-line">
                  <span>Information</span>
                </span>
              </h2>
              <p className="contact-lead">
                Prepare your enquiry below, then send it through your email app.
              </p>
              <ol className="contact-steps">
                {STEPS.map((label, index) => {
                  const number = index + 1;
                  const state =
                    number < step
                      ? "done"
                      : number === step
                        ? "current"
                        : "next";
                  return (
                    <li
                      key={label}
                      data-state={state}
                      aria-current={state === "current" ? "step" : undefined}
                    >
                      <span className="contact-step-number" aria-hidden="true">
                        {number}
                      </span>
                      <span className="contact-step-label">{label}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <form
              className="contact-form"
              aria-labelledby="contact-heading"
              noValidate
              onSubmit={handleSubmit}
            >
              <div className="contact-fields">
                <Field
                  id="contact-first-name"
                  label="First Name"
                  name="First-Name"
                  autoComplete="given-name"
                  required
                  {...bind("firstName")}
                />
                <Field
                  id="contact-last-name"
                  label="Last Name"
                  name="Last-Name"
                  autoComplete="family-name"
                  required
                  {...bind("lastName")}
                />
                <Field
                  id="contact-company"
                  label="Company"
                  name="Company"
                  autoComplete="organization"
                  {...bind("company")}
                />
                <Field
                  id="contact-phone"
                  label="Your Phone"
                  name="Phone-2"
                  type="tel"
                  autoComplete="tel"
                  {...bind("phone")}
                />
                <Field
                  id="contact-email"
                  label="Your Email"
                  name="Email-2"
                  type="email"
                  autoComplete="email"
                  required
                  wide
                  {...bind("email")}
                />
                <Field
                  id="contact-message"
                  label="Your Message"
                  name="Your-Message"
                  rows="5"
                  required
                  multiline
                  wide
                  {...bind("message")}
                />
                <div
                  className="contact-cell contact-cell--wide contact-upload"
                  data-invalid={fileState === "error" ? "true" : undefined}
                  data-selected={fileState === "selected" ? "true" : undefined}
                >
                  <span className="contact-upload-tile" aria-hidden="true">
                    {fileState === "error" ? (
                      <CircleAlert size={24} />
                    ) : fileState === "selected" ? (
                      <Check size={24} />
                    ) : (
                      <Upload size={24} />
                    )}
                  </span>
                  <div className="contact-upload-copy">
                    <label htmlFor="contact-file">Upload File</label>
                    <span id="contact-file-hint">Max file size 10MB.</span>
                    <p
                      className="contact-upload-message"
                      id="contact-file-message"
                      role="status"
                    >
                      {fileMessage}
                    </p>
                  </div>
                  <input
                    id="contact-file"
                    name="file"
                    type="file"
                    aria-describedby="contact-file-hint contact-file-message"
                    onChange={handleFile}
                  />
                </div>
              </div>

              <div role="status">
                {submitted && (
                  <motion.div
                    ref={draft}
                    className="contact-draft"
                    initial={reduced ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="contact-draft-body">
                      <p className="contact-draft-title">
                        Your enquiry is ready. No message has been sent. Open
                        your email app to send it to Anthill.
                      </p>
                      <dl>
                        <div>
                          <dt>To</dt>
                          <dd>info@anthillventures.com</dd>
                        </div>
                        <div>
                          <dt>Subject</dt>
                          <dd>{subject}</dd>
                        </div>
                        <div>
                          <dt>Message</dt>
                          <dd className="contact-draft-message">
                            {values.message}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <motion.a
                      ref={sendLink}
                      href={emailHref}
                      className="contact-send"
                      whileTap={reduced ? undefined : { scale: 0.995 }}
                    >
                      Send by email <Mail aria-hidden="true" />
                    </motion.a>
                  </motion.div>
                )}
              </div>
              {!submitted && (
                <motion.button
                  className="contact-send"
                  type="submit"
                  whileTap={reduced ? undefined : { scale: 0.995 }}
                >
                  Prepare enquiry <Send aria-hidden="true" />
                </motion.button>
              )}
            </form>
          </div>
        </section>

        <section className="contact-offices">
          <div className="container">
            <h2 className="eyebrow contact-offices-eyebrow">
              {words(hero.blocks.find((b) => words(b) === "info") || {})}
            </h2>
            <div className="contact-inquiries">
              <h3>Inquiries</h3>
              {phone && <p className="contact-phone">{phone}</p>}
            </div>
            {emailBlock && (
              <a className="contact-email" href={emailBlock.href}>
                <span className="contact-email-mask">
                  <span className="contact-email-text">
                    Info@
                    <wbr />
                    anthillventures.com
                  </span>
                </span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            )}
            <div className="contact-offices-rule" aria-hidden="true" />
            <div className="contact-office-grid">
              {offices.map(({ name, address, zone, abbreviation }) => (
                <article className="contact-office" key={name}>
                  <h3>{name}</h3>
                  <address>
                    {address.slice(0, address.indexOf(",") + 1)}
                    <br />
                    {address.slice(address.indexOf(",") + 2)}
                  </address>
                  <OfficeTime zone={zone} abbreviation={abbreviation} />
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
