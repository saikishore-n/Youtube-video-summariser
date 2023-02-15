function renderSummary(){
    toggleLoading(true);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: getTranscript,
            world: "MAIN"
        })
        .then((results) => {
            let transcript_text = results[0].result;
            if(transcript_text==false){
                const summaryP = document.createElement("p");
                summaryP.id = "summary";
                summaryP.innerText = "Enable transcript";
                document.querySelector(".container").appendChild(summaryP);
                toggleLoading(false);
                return;
            }
            n_tokens = transcript_text.split(" ").length;
            if(n_tokens<7000){
                transcript_text = cleanTranscript(transcript_text);
                summarize({
                    "inputs": transcript_text,
                }).then((response) => {
                    try{
                        const summaryP = document.createElement("p");
                        summaryP.id = "summary";
                        summaryP.innerText = response[0]["summary_text"];
                        document.querySelector(".container").appendChild(summaryP);
                        document.querySelector(".main_button").style.display = "none";
                        const copyButton = document.createElement("button");
                        copyButton.classList.add("copy-button");
                        copyButton.innerText = "Copy to clipboard";
                        copyButton.addEventListener("click", () => {
                            navigator.clipboard.writeText(document.querySelector("#summary").innerText);
                            copyButton.innerText = "Copied!";
                        });
                        document.querySelector(".container").appendChild(copyButton);
                    } catch(err){
                        document.querySelector("#summary").innerText = "Model is loading. Please try again in a few seconds";
                    }
                })
                .then(() => toggleLoading(false));
            } else{
                const summaryP = document.createElement("p");
                summaryP.id = "summary";
                summaryP.innerText = "Transcript is too long to summarize";
                document.querySelector(".container").appendChild(summaryP);
                toggleLoading(false);
            }
        });
    });
}
function getTranscript(){
    let transcript_text = "";
    const transcriptElement = document.getElementsByTagName("ytd-transcript-renderer")[0];
    if(!transcriptElement){
        return false;
    }
    transcriptElement.data.content.transcriptSearchPanelRenderer.body.transcriptSegmentListRenderer.initialSegments.forEach(ele => 
    transcript_text += (" "+ele.transcriptSegmentRenderer.snippet.runs[0].text));
    return transcript_text;
}
    
function cleanTranscript(text){
    text = text.replace(/\[.*?\]/g, "");
    text = text.replace(/\s+/g, " ");
    return text
}
async function summarize(data) {
    const api_key = await fetch("config.json").then(response => response.json()).then(data => data.api_key);
	const response = await fetch(
		"https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
		{
			headers: { Authorization: `Bearer ${api_key}` },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

function toggleLoading(enable=true){
    if(enable){
        const img = document.createElement("img");
        img.classList.add("loading-svg");
        img.src = "assets/img/loading.svg";
        img.alt = "Loading";
        document.querySelector(".container").appendChild(img);
    } else{
        document.querySelector(".container").removeChild(document.querySelector(".loading-svg"));
    }
}

function mainClicked(){
    renderSummary();
}

document.querySelector(".main_button").addEventListener("click", mainClicked);