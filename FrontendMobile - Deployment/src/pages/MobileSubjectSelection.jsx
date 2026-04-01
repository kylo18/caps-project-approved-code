import { useOutletContext, useNavigate } from "react-router-dom";
import AllSubjectsDropDown from "../components/subjectsDean";

const MobileSubjectSelection = () => {
    const { setSelectedSubject } = useOutletContext();
    const navigate = useNavigate();

    const handleSelect = (subject) => {
        setSelectedSubject(subject);
        navigate(-1); // Navigate back to the previous page
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen dark:bg-black/95" >
            <h1 className="text-xl font-bold mb-6 dark:text-white" > Select a Subject </h1>
            < div className="space-y-4" >
                <AllSubjectsDropDown
                    isExpanded={true}
                    setSelectedSubject={handleSelect}
                />
            </div>
        </div>
    );
};
export default MobileSubjectSelection;
