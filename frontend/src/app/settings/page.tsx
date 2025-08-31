'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Trash2,
  Save
} from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    bio: 'Computer Science student passionate about AI and machine learning.',
    timezone: 'UTC-5',
    language: 'en',
    studyGoal: 180, // minutes per day
    breakDuration: 15, // minutes
    sessionLength: 45 // minutes
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    studyReminders: true,
    weeklyReports: true,
    achievementAlerts: true
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    shareProgress: false,
    allowTeacherAccess: true,
    allowParentAccess: true
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = () => {
    // Save settings logic here
    console.log('Settings saved:', { profile, notifications, privacy })
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and privacy settings</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Study
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline">Change Photo</Button>
                    <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                        <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="study" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Study Preferences</CardTitle>
                <CardDescription>Customize your study sessions and goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="studyGoal">Daily Study Goal (minutes)</Label>
                    <Input 
                      id="studyGoal"
                      type="number"
                      value={profile.studyGoal}
                      onChange={(e) => setProfile(prev => ({ ...prev, studyGoal: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionLength">Session Length (minutes)</Label>
                    <Input 
                      id="sessionLength"
                      type="number"
                      value={profile.sessionLength}
                      onChange={(e) => setProfile(prev => ({ ...prev, sessionLength: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                    <Input 
                      id="breakDuration"
                      type="number"
                      value={profile.breakDuration}
                      onChange={(e) => setProfile(prev => ({ ...prev, breakDuration: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Study Recommendations</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Optimal session length: 25-45 minutes</p>
                    <p>• Recommended break: 5-15 minutes</p>
                    <p>• Daily goal: 2-4 hours for intensive learning</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about your progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {key === 'emailNotifications' && 'Receive updates via email'}
                        {key === 'pushNotifications' && 'Browser and mobile push notifications'}
                        {key === 'studyReminders' && 'Reminders for scheduled study sessions'}
                        {key === 'weeklyReports' && 'Weekly progress summary emails'}
                        {key === 'achievementAlerts' && 'Notifications for achievements and milestones'}
                      </p>
                    </div>
                    <Button
                      variant={value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                    >
                      {value ? 'On' : 'Off'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control who can see your information and progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select value={privacy.profileVisibility} onValueChange={(value) => setPrivacy(prev => ({ ...prev, profileVisibility: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Share Progress with Classmates</h4>
                      <p className="text-sm text-muted-foreground">Allow other students to see your study progress</p>
                    </div>
                    <Button
                      variant={privacy.shareProgress ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrivacy(prev => ({ ...prev, shareProgress: !prev.shareProgress }))}
                    >
                      {privacy.shareProgress ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Teacher Access</h4>
                      <p className="text-sm text-muted-foreground">Allow teachers to view your progress and tag weak topics</p>
                    </div>
                    <Button
                      variant={privacy.allowTeacherAccess ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrivacy(prev => ({ ...prev, allowTeacherAccess: !prev.allowTeacherAccess }))}
                    >
                      {privacy.allowTeacherAccess ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Parent Access</h4>
                      <p className="text-sm text-muted-foreground">Allow parents to view your study reports</p>
                    </div>
                    <Button
                      variant={privacy.allowParentAccess ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrivacy(prev => ({ ...prev, allowParentAccess: !prev.allowParentAccess }))}
                    >
                      {privacy.allowParentAccess ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of your interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Theme</h4>
                    <p className="text-sm text-muted-foreground">Choose between light and dark mode</p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-background border">
                      <CardContent className="p-4">
                        <h5 className="font-semibold mb-2">Sample Card</h5>
                        <p className="text-muted-foreground text-sm mb-3">This is how cards will look in your chosen theme.</p>
                        <Button size="sm">Sample Button</Button>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50 border">
                      <CardContent className="p-4">
                        <h5 className="font-semibold mb-2">Muted Card</h5>
                        <p className="text-muted-foreground text-sm mb-3">Secondary content styling preview.</p>
                        <Button size="sm" variant="outline">Outline Button</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>

            {showDeleteConfirm && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">Are you sure?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This action cannot be undone. All your data, progress, and study history will be permanently deleted.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive">
                    Yes, Delete My Account
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}