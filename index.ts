import "@logseq/libs";

async function main(blockId: string) {
  
  const block = await logseq.Editor.getBlock(blockId, {
    includeChildren: false,
  });
  if (block === null) {
    return;
  }
  const line = block.content.trim();

  let pageRef = line.match(/\[\[.+\]\]/);
  if (pageRef) {
    let newBlockContent = "";
    let regex = /\{\{embed.*\[\[.+\]\].*\}\}/;
    let result = regex.test(line);
    if (!result) {
      newBlockContent = line.replace(/\[\[.+\]\]/, `{{embed ${pageRef[0]}}}`);
    }
    else {
      newBlockContent = line.replace(regex, `${pageRef[0]}`);
    }
    await logseq.Editor.updateBlock(block.uuid, newBlockContent);
  }
  
}

async function TogglePage(blockId: string) {
  
  const currentBlock = await logseq.Editor.getBlock(blockId, {
    includeChildren: false,
  });
  if (currentBlock === null) {
    return;
  }
  const line = currentBlock.content.trim();

  let pageRef = line.match(/\[\[.+\]\]/);
  if (pageRef) {
    let embedRegex = /\{\{embed.*\[\[.+\]\].*\}\}/;
    let toggleDirection = !embedRegex.test(line) ? "expand" : "collapse";
    let page = await logseq.Editor.getPage(currentBlock.page.id)
    let pageBlocks = await logseq.Editor.getPageBlocksTree(page.uuid);
    if (toggleDirection === "expand") {
      for (const block of pageBlocks) {
        const line = block.content.trim();
        let pageRef = line.match(/\[\[.+\]\]/);
        if (pageRef) {
          if (!embedRegex.test(line)) {
          let newBlockContent = line.replace(/\[\[.+\]\]/, `{{embed ${pageRef[0]}}}`);
          await logseq.Editor.updateBlock(block.uuid, newBlockContent);
          }
        }
      }
    }
    else if (toggleDirection === "collapse") {
      for (const block of pageBlocks) {
        const line = block.content.trim();
        let pageRef = line.match(/\[\[.+\]\]/);
        if (pageRef) {
          if (embedRegex.test(line)) {
            let newBlockContent = line.replace(embedRegex, `${pageRef[0]}`);
            await logseq.Editor.updateBlock(block.uuid, newBlockContent);
          }
        }
      }
    }
  }
}

async function CreateZettel(blockId: string) {
  
  const currentBlock = await logseq.Editor.getBlock(blockId, {
    includeChildren: false,
  });
  if (currentBlock === null) {
    return;
  }
  const line = currentBlock.content.trim();

  let date = new Date()
  let yyyy = date.getFullYear();
  let MM = date.getMonth()+1;
  let dd = date.getDate();
  let hh = date.getHours();
  let mm = date.getMinutes();
  let ss = date.getSeconds();
  if (MM < 10) { MM = "0" + MM; }
  if (dd < 10) { dd = "0" + dd; }
  if (hh < 10) { hh = "0" + hh; }
  if (mm < 10) { mm = "0" + mm; }
  if (ss < 10) { ss = "0" + ss; }
  let timestamp = `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
  let newBlockContent = `[[${timestamp}]]`;

  // If the block is empty add the zettel to the block.
  if (line === "") {
    await logseq.Editor.updateBlock(currentBlock.uuid, newBlockContent);
  }
  else {
    // Insert a new block.
    await logseq.Editor.insertBlock(currentBlock.uuid, newBlockContent, {before: true, focus: false});
  }

}

logseq
  .ready(() => {
    logseq.Editor.registerSlashCommand("ZK Toggle Block", async (e) => {
      main(e.uuid);
    });
    logseq.Editor.registerBlockContextMenuItem("ZK Toggle Block", async (e) => {
      main(e.uuid);
    });
    logseq.Editor.registerSlashCommand("ZK Toggle Page Blocks", async (e) => {
      TogglePage(e.uuid);
    });
    logseq.Editor.registerBlockContextMenuItem("ZK Toggle Page Blocks", async (e) => {
      TogglePage(e.uuid);
    });
    logseq.Editor.registerSlashCommand("ZK Create Zettel", async (e) => {
      CreateZettel(e.uuid);
    });
    logseq.Editor.registerBlockContextMenuItem("ZK Create Zettel", async (e) => {
      CreateZettel(e.uuid);
    });
  })
  .catch(console.error);