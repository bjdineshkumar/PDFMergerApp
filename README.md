
# 📄 PDF Merger Tool

PDF Merger Tool is a simple Electron-based application that **merges a Resume and Cover Letter into one PDF**.

🚀 **Built with Electron & Python**  
✅ **Supports Windows & macOS**  
📂 **Standalone App – No Python Installation Required**  

---

## **📌 Features**
- 📝 **Merge Resume + Cover Letter PDFs** into one document.
- 💻 **Works on Windows & macOS** (packaged for both platforms).
- 🛠️ **No need to install Python separately** – Python is bundled with the app.
- 🔒 **Simple & Secure** – No internet required.

---

## **📥 Download & Install**

### **Windows (.exe)**
1. [Download the latest Windows installer](https://github.com/bjdineshkumar/pdf-merger-tool/releases)
2. **Run the `.exe` file** and follow installation steps.
3. Open the **PDF Merger Tool** and start merging your PDFs.

### **macOS (.dmg)**
1. [Download the latest macOS `.dmg`](https://github.com/bjdineshkumar/pdf-merger-tool/releases)
2. **Double-click the `.dmg` file** and drag the app to **Applications**.
3. Open the **PDF Merger Tool** and merge your PDFs.

---

## **🛠️ Development Setup**

If you want to run the app from source, follow these steps:

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/bjdineshkumar/pdf-merger-tool.git
cd pdf-merger-tool
```

### **2️⃣ Install Dependencies**
```sh
npm install
```

### **3️⃣ Run the App**
```sh
npm start
```

---

## **📦 Packaging for Production**
To build a **Windows or macOS installer**, use:

### **Windows:**
```sh
npx electron-builder --win
```
✅ **Creates a `.exe` installer in `dist/`**

### **macOS:**
```sh
npx electron-builder --mac
```
✅ **Creates a `.dmg` installer in `dist/`**  
_(Run this command on a macOS machine or use GitHub Actions)_

---

## **💻 Building macOS App on Windows**
If you're on **Windows**, you can **build a macOS `.dmg` file** using GitHub Actions.

1. **Push your code to GitHub**:
   ```sh
   git push origin main
   ```
2. **GitHub will automatically build the macOS app**.
3. **Download the `.dmg` from GitHub Actions** under the "Artifacts" section.

---

## **📜 License**
📜 **MIT License** – Free to use and modify.  

👨‍💻 **Created by [Dinesh Kumar](https://www.linkedin.com/in/dinesh-kumar-baalajee-jothi/)**  

---

### **🌟 Star the repo if you found this useful! ⭐**

