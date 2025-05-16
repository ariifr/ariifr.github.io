        function copyToClipboard(text, method) {
            navigator.clipboard.writeText(text).then(function() {
                showToast(`Nomor ${method} telah disalin: ${text}`);
            }, function() {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showToast(`Nomor ${method} telah disalin: ${text}`);
            });
        }
        
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            
            setTimeout(function() {
                toast.classList.remove('show');
            }, 3000);
        }