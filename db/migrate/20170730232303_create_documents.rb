class CreateDocuments < ActiveRecord::Migration[5.0]
  def change
    create_table :documents do |t|
      t.string :name, null: false
			t.text :content
			t.belongs_to :user, index: true, foreign_key: true, null: false
      t.timestamps
    end
  end
end
