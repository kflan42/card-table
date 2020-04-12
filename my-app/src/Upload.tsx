import React, { ChangeEvent } from 'react'

export interface UploadState {
}

const Upload: React.FC<UploadState> = ({
}) => {

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target && event.target.files) {
      event.persist() // make name stick next to chooser
      event.target.files[0].text()
        .then(manageUploadingText)
        .catch(function (reason) {
          console.log(`Error during upload ${reason}`);
          event.target.value = ''; // to allow upload of same file if error occurs
      });
    }
  }

  function manageUploadingText(text: string) {
    console.log(text)
    // TODO send deck to server here
  }

    return (
      <div >
        <input accept=".txt,*" type="file" onChange={handleChange}/>
        {/* <img src={this.state.file} style={{ width:"100%", height:"100%" }}/> */}
      </div>
    );
  
}
export default Upload