

export async function handleConvertToDFA(graph) {
  const response = await fetch(
    "https://automata-backend.onrender.com/api/automata/convert-to-dfa",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graph),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error:", response.status, errorText);
    return;
  }

  const result = await response.json();
  console.log("Converted DFA:", result);
}

export async function handleConvertFromAutomataToRegex(graph){
  const response = await fetch(
    "https://automata-backend.onrender.com/api/automata/convert-to-regex",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graph),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error:", response.status, errorText);
    return;
  }

  const result = await response.json();
  console.log("Converted Regex:", result);

}

export async function handleConvertFromRegexToNFA(regexText){
    const response = await fetch(
    "https://automata-backend.onrender.com/api/automata/convert-to-nfa",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(regexText),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error:", response.status, errorText);
    return;
  }

  const result = await response.json();
  console.log("Converted Regex:", result);

}