const MODE_COLORS = {
    sweet: ['#fff8f2', '#ffd9e7', '#ffc992'],
    spicy: ['#fff1e9', '#ffc7d4', '#ffab68'],
    chaotic: ['#fff1fb', '#f7b5d3', '#ff9962']
};

function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';

    words.forEach((word) => {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth) {
            if (line) lines.push(line);
            line = word;
        } else {
            line = test;
        }
    });

    if (line) lines.push(line);
    return lines;
}

export async function createResultBlob({
    mode = 'spicy',
    title,
    summary,
    userName,
    crushName,
    result,
    playerChoice,
    computerChoice
}) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;

    const ctx = canvas.getContext('2d');
    const colors = MODE_COLORS[mode] || MODE_COLORS.spicy;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    roundRect(ctx, 80, 140, 920, 1050, 44);
    ctx.fill();

    ctx.fillStyle = '#9d2f57';
    ctx.font = '600 42px "Cinzel", serif';
    ctx.fillText('ROSEFIRE ORACLE', 312, 240);

    ctx.fillStyle = '#661a35';
    ctx.font = '700 78px "Cormorant Garamond", serif';
    ctx.fillText(title, 130, 340);

    ctx.fillStyle = '#7a4358';
    ctx.font = '500 42px "Cormorant Garamond", serif';
    ctx.fillText(`${userName} + ${crushName}`, 130, 408);

    ctx.fillStyle = '#892a4d';
    ctx.font = '600 34px "Cinzel", serif';
    ctx.fillText(`Result: ${result.toUpperCase()}`, 130, 470);

    ctx.fillStyle = '#5f3044';
    ctx.font = '500 36px "Cormorant Garamond", serif';
    ctx.fillText(`You: ${playerChoice}   |   Destiny: ${computerChoice}`, 130, 530);

    ctx.fillStyle = '#65384c';
    ctx.font = '500 40px "Cormorant Garamond", serif';
    const lines = wrapText(ctx, summary, 820);
    lines.slice(0, 9).forEach((line, index) => {
        ctx.fillText(line, 130, 620 + index * 52);
    });

    ctx.fillStyle = '#ba4d72';
    ctx.font = '500 44px "Parisienne", cursive';
    ctx.fillText('kisses are optional, spark is mandatory', 190, 1130);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
}

export async function shareResultCard(payload) {
    const blob = await createResultBlob(payload);
    if (!blob) return false;

    const file = new File([blob], 'rosefire-result.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            title: 'Rosefire Oracle Result',
            text: `${payload.userName} + ${payload.crushName} on Rosefire Oracle`,
            files: [file]
        });
        return true;
    }

    await downloadResultCard(payload, blob);
    return false;
}

export async function downloadResultCard(payload, existingBlob) {
    const blob = existingBlob || await createResultBlob(payload);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rosefire-result.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}
