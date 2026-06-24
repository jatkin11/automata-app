

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

  return await response.json();

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

  return await response.json();

}

export async function handleConvertFromRegexToNFA(regexText){
    const response = await fetch(
    "https://automata-backend.onrender.com/api/automata/convert-to-nfa",
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: regexText,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error:", response.status, errorText);
    return;
  }

  return await response.json();

}


export async function handleMinimiseNfa(graph) {
  const response = await fetch(
    "https://automata-backend.onrender.com/api/automata/minimise-nfa",
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

  return await response.json();

}