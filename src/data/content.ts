/**
 * Single source of truth for every visible string on the page.
 * Hard constraint: no em-dash or en-dash characters anywhere in this file.
 * Ranges use a plain hyphen.
 */

export const profile = {
  name: "Shubham Pandya",
  role: "CyberSecurity and AI Engineer",
  location: "Oshawa, Ontario",
  email: "Shubhampandya911@gmail.com",
  linkedin: "https://linkedin.com/in/shubhampandy",
  github: "https://github.com/ShubhamPandya01",
  // Hero subtext: 19 words, within the 20-word cap.
  heroSubtext:
    "Three years defending production systems in the field, now training the models and pipelines that do it at scale.",
  availability: "Open to co-op and full-time roles",
};

export const metrics = [
  { value: 3, decimals: 0, unit: "yrs", label: "Securing production IT" },
  { value: 100, decimals: 0, unit: "+", label: "Endpoints monitored" },
  { value: 1.04, decimals: 2, unit: "M", label: "Records processed" },
  { value: 8, decimals: 0, unit: "", label: "Forensic investigations" },
];

/** Feeds the tools marquee. Order is deliberate: recognisable names first. */
export const marqueeTools = [
  "Wireshark", "Python", "AWS", "Metasploit", "scikit-learn", "Docker", "Splunk",
  "LangChain", "Burp Suite", "pandas", "Nmap", "GitHub Actions", "TensorFlow",
  "Kali Linux", "Power BI", "Volatility", "FAISS", "Autopsy", "Tableau", "Azure AD",
];

export type Capability = {
  title: string;
  body: string;
  icon: "shield" | "brain" | "cloud" | "chart";
  points: string[];
};

export const capabilities: Capability[] = [
  {
    title: "Security operations",
    icon: "shield",
    body: "Monitoring, triage, and response across endpoints, networks, and applications.",
    points: ["Log and event analysis", "Incident response", "Vulnerability assessment", "Digital forensics"],
  },
  {
    title: "Applied machine learning",
    icon: "brain",
    body: "Supervised and unsupervised models, plus retrieval pipelines over real corpora.",
    points: ["Anomaly detection", "LSTM forecasting", "RAG with LangChain", "Model evaluation"],
  },
  {
    title: "Cloud and delivery",
    icon: "cloud",
    body: "Provisioning, containers, and pipelines on a billed AWS account, not a sandbox.",
    points: ["EC2 and S3", "Least privilege IAM", "Docker", "CI gates in GitHub Actions"],
  },
  {
    title: "Data and reporting",
    icon: "chart",
    body: "Ingestion through to dashboards, with the methodology written down.",
    points: ["Python and pandas", "SQL", "Power BI", "Tableau"],
  },
];

export const experience = {
  role: "Cyber Security Analyst",
  company: "Syphnosys Technology",
  location: "Surat, India",
  period: "Jan 2022 - Dec 2024",
  note: "Joined as an intern in the final semester of my bachelor’s degree and moved to full time analyst on graduation.",
  bullets: [
    {
      head: "Monitored the estate",
      body: "Watched security posture across systems, networks, and applications, analysing logs and events to surface anomalous activity on more than 100 endpoints.",
    },
    {
      head: "Ran the infrastructure",
      body: "Administered Windows Server, Linux, VPS, and Hyper-V environments with attention to configuration, backup verification, and disaster recovery readiness.",
    },
    {
      head: "Held the network",
      body: "Configured Meraki and Ubiquiti switching, access points, and firewalls, and deployed 3CX and Asterisk voice systems at roughly 99.9 percent uptime.",
    },
    {
      head: "Automated the tedium",
      body: "Wrote Python to parse logs, extract data, and generate reports, which cut manual effort and made output consistent between analysts.",
    },
    {
      head: "Wrote the policy",
      body: "Drafted and enforced IT security policy and user access control procedures, then trained staff on the SharePoint and Teams rollout.",
    },
    {
      head: "Supported the people",
      body: "Delivered tier 1 and tier 2 support for Microsoft 365, Azure Active Directory, VPN, account provisioning, and device configuration.",
    },
  ],
};

export type Project = {
  slug: string;
  title: string;
  blurb: string;
  context: string;
  year: string;
  role: string;
  body: string;
  stack: string[];
  category: "Security" | "AI and ML" | "Cloud" | "Data";
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "agripulse",
    title: "AgriPulse",
    blurb: "Crop yield forecasting for Canadian growers",
    context: "Durham College capstone",
    year: "2026",
    role: "Data analyst on a team of five",
    body: "A decision support tool combining computer vision, LSTM forecasting over 25 years of yield data, and a Gemini advisory layer. I owned the dataset: gathering, cleaning, and restructuring 25 years of Canadian crop records, applying MinMax scaling and sliding window transforms for the model, and mapping regional coordinates onto yield data.",
    stack: ["Python", "pandas", "LSTM", "React", "Flask"],
    category: "AI and ML",
    featured: true,
  },
  {
    slug: "smartcodebot",
    title: "SmartCodeBot",
    blurb: "A reviewer that documents what it reads",
    context: "Durham College capstone",
    year: "2026",
    role: "RAG pipeline owner on a team of five",
    body: "A GitHub native bot that reviews pull requests and learns a team’s review style. I built the retrieval augmented documentation generator: a pipeline that writes docs for changed functions on merge to main, with a LangChain embedding stage, a FAISS and Pinecone vector store, and the prompt architecture behind it.",
    stack: ["Python", "LangChain", "FAISS", "Pinecone", "Claude API"],
    category: "AI and ML",
    featured: true,
  },
  {
    slug: "cloud-pipeline",
    title: "Cloud, containers, and CI",
    blurb: "Real AWS, real billing, real teardown",
    context: "Durham College, AI in Enterprise",
    year: "2026",
    role: "Sole engineer",
    body: "Provisioned Ubuntu EC2 instances through the AWS CLI on a personal account with live billing, covering key pairs, security groups, AMI resolution, and verified teardown. Wrote Dockerfiles for static and Flask workloads running concurrently, built CI with lint and test gates, and served a static site from S3 behind a least privilege instance profile with no stored access keys.",
    stack: ["AWS", "Docker", "GitHub Actions", "IAM", "Git"],
    category: "Cloud",
  },
  {
    slug: "forensics",
    title: "Forensic investigation labs",
    blurb: "Recovering what someone tried to erase",
    context: "Durham College, Computer Forensics",
    year: "2025",
    role: "Investigator",
    body: "Eight hands on investigations spanning deleted file recovery, memory forensics, Windows registry analysis, and email header tracing. Closed with a full case simulating a criminal scenario containing hidden, deleted, and encrypted evidence, documented under chain of custody.",
    stack: ["Autopsy", "FTK Imager", "Volatility", "WinHex"],
    category: "Security",
  },
  {
    slug: "pentest",
    title: "Network penetration testing",
    blurb: "Recon through to exploitation, on the clock",
    context: "Durham College, Network Security",
    year: "2025",
    role: "Tester",
    body: "Live testing across isolated network segments under exam conditions, covering reconnaissance, deauthentication, and WPA handshake capture, ending with located target data. Followed by seven guided labs running network level attacks against Windows targets from Parrot OS, through to countermeasures.",
    stack: ["Nmap", "Metasploit", "Aircrack-ng", "Parrot OS"],
    category: "Security",
  },
  {
    slug: "homelab",
    title: "Attack and defense lab",
    blurb: "Break it, harden it, break it again",
    context: "Personal project",
    year: "Ongoing",
    role: "Both sides",
    body: "A two machine lab, Kali attacking and Windows Server defending, that I attack and then harden in cycles. Each pass builds on privilege escalation, lateral movement, persistence, and post exploitation, and each fix gets verified by rerunning the attack that found it.",
    stack: ["Kali Linux", "Windows Server", "Hyper-V"],
    category: "Security",
  },
  {
    slug: "data-pipeline",
    title: "Million record pipeline",
    blurb: "Ingestion to dashboard, documented",
    context: "Durham College, AI Visualization",
    year: "2026",
    role: "Sole engineer",
    body: "A Python and pandas pipeline over a 1,046,852 record dataset, handling ingestion, cleaning, deduplication, and standardisation, then surfaced through Power BI and Tableau dashboards with the methodology written up end to end.",
    stack: ["Python", "pandas", "Power BI", "Tableau"],
    category: "Data",
  },
  {
    slug: "ml-anomaly",
    title: "Anomaly detection models",
    blurb: "The methods behind threat detection",
    context: "Durham College, AI Algorithms",
    year: "2025",
    role: "Sole engineer",
    body: "Built and evaluated supervised and unsupervised models including SVM, Random Forest, kNN, K-Means, DBSCAN, and PCA, with GridSearchCV tuning, cross validation, and ROC threshold analysis. The same methodology carries directly into anomaly and threat detection work.",
    stack: ["Python", "scikit-learn", "GridSearchCV", "PCA"],
    category: "AI and ML",
  },
];

export type SkillDomain = {
  id: string;
  label: string;
  summary: string;
  groups: { heading: string; items: string[] }[];
};

export const skillDomains: SkillDomain[] = [
  {
    id: "security",
    label: "Security",
    summary: "Detection and response work, plus the tooling it runs on.",
    groups: [
      {
        heading: "Practice",
        items: [
          "Threat detection", "Security monitoring", "SIEM", "Log and event analysis",
          "Incident response", "Digital forensics", "Vulnerability assessment",
          "Penetration testing", "Access control", "Security policy and compliance",
          "OWASP Top 10",
        ],
      },
      {
        heading: "Tooling",
        items: [
          "Wireshark", "Burp Suite", "Nmap", "Metasploit", "Splunk", "CrowdStrike",
          "Autopsy", "FTK Imager", "Volatility", "WinHex", "Aircrack-ng", "Airodump-ng",
        ],
      },
      {
        heading: "Ranges",
        items: ["TryHackMe", "HackTheBox", "HackerOne", "Bugcrowd", "PortSwigger Academy", "DVWA"],
      },
    ],
  },
  {
    id: "ai",
    label: "AI and ML",
    summary: "Classical modelling through to retrieval augmented generation.",
    groups: [
      {
        heading: "Libraries",
        items: ["scikit-learn", "TensorFlow", "pandas", "NumPy", "Jupyter", "matplotlib", "seaborn"],
      },
      {
        heading: "Methods",
        items: [
          "Classification", "Clustering", "Anomaly detection", "LSTM time series",
          "Model training and evaluation", "Cross validation", "PCA",
        ],
      },
      {
        heading: "Generative",
        items: ["LangChain", "FAISS", "Pinecone", "Prompt engineering", "LLM integration"],
      },
    ],
  },
  {
    id: "cloud",
    label: "Cloud and DevOps",
    summary: "Provisioning, containers, and the pipelines that gate a merge.",
    groups: [
      {
        heading: "Platforms",
        items: ["AWS EC2", "AWS S3", "AWS IAM", "AWS CLI", "Azure Active Directory", "Hyper-V"],
      },
      {
        heading: "Delivery",
        items: ["Docker", "GitHub Actions", "Git", "GitHub CLI", "Branching strategy"],
      },
      {
        heading: "Systems",
        items: ["Linux administration", "Windows Server", "Kali Linux", "Parrot OS", "Virtualization"],
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    summary: "Getting messy data into a shape a decision can rest on.",
    groups: [
      {
        heading: "Languages",
        items: ["Python", "SQL", "Java", "Bash"],
      },
      {
        heading: "Pipeline",
        items: [
          "Data cleaning", "Transformation", "Deduplication", "Large scale datasets",
          "Automation and scripting",
        ],
      },
      {
        heading: "Reporting",
        items: ["Power BI", "Tableau", "Excel", "Dashboard design"],
      },
    ],
  },
];

export const education = [
  {
    credential: "Post-Graduate Certificate, AI Analysis, Design and Implementation",
    school: "Durham College",
    period: "Jan 2026 - Aug 2026",
    status: "In progress",
    detail:
      "AI algorithms, applied machine learning, knowledge and expert systems, AI in enterprise systems, and data storytelling.",
  },
  {
    credential: "Post-Graduate Certificate, Cybersecurity",
    school: "Durham College",
    period: "Jan 2025 - Aug 2025",
    status: "Completed",
    detail: "",
  },
  {
    credential: "Bachelor of Engineering, Computer Engineering",
    school: "Darshan University",
    period: "Apr 2018 - May 2022",
    status: "Completed",
    detail: "",
  },
];

export type CertGroup = { heading: string; items: { name: string; org: string; note: string }[] };

export const certifications: CertGroup[] = [
  {
    heading: "In progress",
    items: [
      { name: "CompTIA Security+", org: "CompTIA", note: "In progress" },
      { name: "CompTIA CySA+", org: "CompTIA", note: "In progress" },
      { name: "ISC2 Candidate", org: "ISC2", note: "Valid to Oct 2026" },
    ],
  },
  {
    heading: "Security",
    items: [
      { name: "Ethical Hacking Essentials", org: "EC-Council", note: "2025" },
      { name: "Security Operations Center in Practice", org: "IBM SkillsBuild", note: "2025" },
      { name: "Enterprise Security in Practice", org: "IBM SkillsBuild", note: "2025" },
      { name: "Threat Intelligence and Hunting", org: "IBM SkillsBuild", note: "2025" },
      { name: "Bug Bounty and Penetration Testing", org: "Shree Academy", note: "2024" },
      { name: "Introduction to Cybersecurity", org: "Cisco", note: "2023" },
    ],
  },
  {
    heading: "AI and data",
    items: [
      { name: "Building Trustworthy AI Enterprise Solutions", org: "IBM SkillsBuild", note: "2025" },
      { name: "Data Governance and Protection", org: "LinkedIn Learning", note: "2026" },
      { name: "Data Literacy", org: "Salesforce Trailhead", note: "2026" },
    ],
  },
];
