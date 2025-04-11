(ns wac.core
  (:require [io.orkes.workflow-resource :as wr]
            [io.orkes.sdk :as sdk]
            [io.orkes.metadata :as metadata])
  (:gen-class))

; Set up an application in your Orkes Conductor cluster. Sign up for a Developer Edition account at https://developer.orkescloud.com.
; - Set your cluster's API URL as url (e.g., "https://developer.orkescloud.com/api/" for Developer Edition).
; - Use the application's Key ID and Secret here.
(def options
  {:url "_CHANGE_ME_"
   :app-key "_CHANGE_ME_"
   :app-secret "_CHANGE_ME_"})

; Function that creates the tasks.
(defn create-tasks
  []
  (vector (sdk/http-task "get-user_ref" {:uri "https://randomuser.me/api/"})
          (sdk/switch-task "user-criteria_ref" "${get-user_ref.output.response.body.results[0].location.country}"
                           {"United States" [(sdk/simple-task "myTask_ref"
                                                              "myTask"
                                                              {"name"
                                                               "${get-user_ref.output.response.body.results[0].name.first}"})]}
                           [])))

; Function that creates the workflow definition.
(defn create-workflow
  [tasks]
  (merge (sdk/workflow "helloWorld" tasks)))

(defn -main
  []
  ; Register the workflow with overwrite = true
  (metadata/register-workflow-def options (-> (create-tasks) (create-workflow)) true)
  ; Start the workflow
  (let [workflow-id (wr/start-workflow options {:name "helloWorld" :version 1})]
    (println "Started workflow:" workflow-id)))